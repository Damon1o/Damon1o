import html
import json
import os
import smtplib
import uuid
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import wraps

from flask import Flask, render_template, url_for, request, redirect, session, flash, jsonify, make_response
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(24).hex())

DATA_DIR = 'static/data'
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}

try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
except OSError:
    pass  # read-only filesystem on serverless hosts (e.g. Vercel)


def read_json(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_json(filename, data):
    path = os.path.join(DATA_DIR, filename)
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    except OSError as e:
        # serverless hosts have a read-only filesystem; content edits only
        # persist when made in the repo and redeployed
        app.logger.warning(f'Could not persist {filename}: {e}')


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated


def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _save_uploaded_image(file):
    if file and _allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f'{uuid.uuid4().hex}.{ext}'
        try:
            file.save(os.path.join(UPLOAD_FOLDER, filename))
        except OSError:
            return None  # read-only filesystem on serverless hosts
        return f'uploads/{filename}'
    return None


@app.context_processor
def inject_globals():
    hp = read_json('heroPhotos.json')
    return {
        'projects': read_json('featuredProjects.json').get('featured-projects', []),
        'hero_photos': {
            'left': hp.get('hero-photos-left', []),
            'right': hp.get('hero-photos-right', []),
        },
        'experience': read_json('experience.json'),
        'site_config': read_json('siteConfig.json'),
    }


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/projects')
def projects():
    all_projects = read_json('featuredProjects.json').get('featured-projects', [])
    tag = request.args.get('tag', '').strip()
    search = request.args.get('search', '').strip().lower()

    all_categories = sorted(set(p.get('category', '') for p in all_projects if p.get('category')) | {'Games', 'Hardware'})

    filtered = all_projects
    if tag:
        filtered = [p for p in filtered if p.get('category', '') == tag]
    if search:
        filtered = [p for p in filtered if search in p.get('title', '').lower() or search in p.get('description', '').lower()]

    return render_template('projects.html',
                           filtered_projects=filtered,
                           all_categories=all_categories,
                           active_category=tag,
                           search_query=search,
                           total_count=len(all_projects))


@app.route('/experience')
def experience():
    return render_template('experience.html')


@app.route('/about')
def about():
    return render_template('about.html', about=read_json('about.json'))


@app.route('/contact')
def contact():
    return render_template('contact.html')


def _send_email_notification(config, name, sender_email, subject, message):
    smtp_server = config.get('smtp_server', 'smtp.gmail.com')
    smtp_port = config.get('smtp_port', 587)
    notification_email = config.get('notification_email')
    email_sender = config.get('email_sender')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')

    if not notification_email or not email_sender or not smtp_password:
        return

    escaped_name = html.escape(name)
    escaped_sender = html.escape(sender_email)
    escaped_subject = html.escape(subject or 'No Subject')
    escaped_message = html.escape(message)
    now = html.escape(datetime.now().strftime('%B %d, %Y at %I:%M %p'))

    # ponytail: inline HTML email, move to template file if format gets complex
    html_body = f'''\
<html><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
<h2 style="color:#CC785C;">New Contact Message</h2>
<table style="border-collapse:collapse;width:100%;">
<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">From</td><td style="padding:8px 12px;">{escaped_name} ({escaped_sender})</td></tr>
<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Subject</td><td style="padding:8px 12px;">{escaped_subject}</td></tr>
<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;">Date</td><td style="padding:8px 12px;">{now}</td></tr>
</table>
<div style="margin-top:20px;padding:16px;background:#fafafa;border-left:4px solid #CC785C;">
<pre style="white-space:pre-wrap;margin:0;font-family:system-ui,sans-serif;">{escaped_message}</pre>
</div>
<p style="margin-top:16px;color:#888;font-size:12px;">Sent from your portfolio contact form.</p>
</body></html>'''

    plain_body = f'New Contact Message\n\nFrom: {name}\nEmail: {sender_email}\nSubject: {subject or "No Subject"}\nDate: {now}\n\n{message}'

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Portfolio Contact: {subject or "No Subject"}'
    msg['From'] = email_sender
    msg['To'] = notification_email
    msg['Reply-To'] = sender_email
    msg.attach(MIMEText(plain_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))

    # ponytail: global smtplib, add async queue if sending blocks noticeably
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(email_sender, smtp_password)
        server.send_message(msg)


@app.route('/contact/submit', methods=['POST'])
def contact_submit():
    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    subject = request.form.get('subject', '').strip()
    message = request.form.get('message', '').strip()

    if not name or not email or not message:
        flash('Please fill in all required fields.', 'error')
        return redirect(url_for('contact'))

    data = read_json('contactMessages.json')
    data['messages'].append({
        'id': datetime.now().strftime('%Y%m%d%H%M%S'),
        'name': name,
        'email': email,
        'subject': subject,
        'message': message,
        'date': datetime.now().strftime('%B %d, %Y at %I:%M %p'),
        'read': False,
    })
    write_json('contactMessages.json', data)

    email_config = read_json('siteConfig.json').get('email', {})
    if email_config.get('enabled'):
        try:
            _send_email_notification(email_config, name, email, subject, message)
        except Exception as e:
            app.logger.error(f'Email notification failed: {e}')

    flash("Message sent successfully! I'll get back to you soon.", 'success')
    return redirect(url_for('contact'))


@app.route('/admin', methods=['GET', 'POST'])
def admin_login():
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_dashboard'))

    if request.method == 'POST':
        if request.form.get('password', '') == read_json('siteConfig.json').get('admin_password', 'admin123'):
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        flash('Invalid password.', 'error')

    return render_template('admin/login.html')


@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))


@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    messages_data = read_json('contactMessages.json')
    all_messages = sorted(messages_data.get('messages', []), key=lambda m: m['date'], reverse=True)
    page = request.args.get('page', 1, type=int)
    per_page = 10
    total = len(all_messages)
    total_pages = max((total + per_page - 1) // per_page, 1)
    if page < 1:
        page = 1
    if page > total_pages:
        page = total_pages
    start = (page - 1) * per_page
    paged_messages = all_messages[start:start + per_page]
    return render_template(
        'admin/dashboard.html',
        contact_messages=paged_messages,
        current_page=page,
        total_pages=total_pages,
        has_prev=page > 1,
        has_next=page < total_pages,
    )


@app.route('/admin/projects/edit/<project_id>', methods=['POST'])
@login_required
def admin_edit_project(project_id):
    data = read_json('featuredProjects.json')
    for p in data.get('featured-projects', []):
        if p['id'] == project_id:
            p['title'] = request.form.get('title', p['title'])
            p['category'] = request.form.get('category', p['category'])
            p['description'] = request.form.get('description', p['description'])
            uploaded = _save_uploaded_image(request.files.get('cover-image-file'))
            p['cover-image'] = uploaded if uploaded else request.form.get('cover-image', p['cover-image'])
            p['tags'] = [t.strip() for t in request.form.get('tags', '').split(',') if t.strip()]
            p['links']['github'] = request.form.get('github', p['links'].get('github', ''))
            p['links']['website'] = request.form.get('website', p['links'].get('website', ''))
            break
    write_json('featuredProjects.json', data)
    flash('Project updated.', 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/projects/add', methods=['POST'])
@login_required
def admin_add_project():
    data = read_json('featuredProjects.json')
    projects = data.get('featured-projects', [])
    new_id = str(max((int(p['id']) for p in projects), default=0) + 1)
    uploaded = _save_uploaded_image(request.files.get('cover-image-file'))
    projects.append({
        'id': new_id,
        'title': request.form.get('title', 'New Project'),
        'category': request.form.get('category', 'Category'),
        'cover-image': uploaded if uploaded else request.form.get('cover-image', 'images/blank.png'),
        'tags': [t.strip() for t in request.form.get('tags', '').split(',') if t.strip()],
        'description': request.form.get('description', ''),
        'links': {
            'github': request.form.get('github', ''),
            'website': request.form.get('website', ''),
        },
    })
    write_json('featuredProjects.json', data)
    flash('Project added.', 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/projects/delete/<project_id>', methods=['POST'])
@login_required
def admin_delete_project(project_id):
    data = read_json('featuredProjects.json')
    data['featured-projects'] = [p for p in data.get('featured-projects', []) if p['id'] != project_id]
    write_json('featuredProjects.json', data)
    flash('Project deleted.', 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/upload-image', methods=['POST'])
@login_required
def admin_upload_image():
    file = request.files.get('file')
    url = _save_uploaded_image(file)
    if url:
        return jsonify({'url': url})
    return jsonify({'error': 'Invalid file'}), 400


@app.route('/admin/hero-photos', methods=['GET', 'POST'])
@login_required
def admin_hero_photos():
    if request.method == 'POST':
        data = read_json('heroPhotos.json')
        for side in ('hero-photos-left', 'hero-photos-right'):
            for i, photo in enumerate(data.get(side, [])):
                photo['image'] = request.form.get(f'{side}_{i}_image', photo.get('image', ''))
        write_json('heroPhotos.json', data)
        flash('Hero photos updated.', 'success')
        return redirect(url_for('admin_dashboard'))
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/experience/edit/<item_type>/<item_id>', methods=['POST'])
@login_required
def admin_edit_experience(item_type, item_id):
    data = read_json('experience.json')
    for item in data.get(item_type, []):
        if item['id'] == item_id:
            item['name'] = request.form.get('name', item.get('name', ''))
            item['role'] = request.form.get('role', item.get('role', ''))
            item['period'] = request.form.get('period', item.get('period', ''))
            item['description'] = request.form.get('description', item.get('description', ''))
            item['link'] = request.form.get('link') or None
            if 'skills' in item:
                item['skills'] = [s.strip() for s in request.form.get('skills', '').split(',') if s.strip()]
            if 'color' in item:
                item['color'] = request.form.get('color', item.get('color', '#CC785C'))
            if 'date' in item:
                item['date'] = request.form.get('date', item.get('date', ''))
                item['location'] = request.form.get('location', item.get('location', ''))
                item['project'] = request.form.get('project', item.get('project', ''))
            break
    write_json('experience.json', data)
    flash('Entry updated.', 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/experience/add/<item_type>', methods=['POST'])
@login_required
def admin_add_experience(item_type):
    data = read_json('experience.json')
    items = data.get(item_type, [])
    new_id = f'{item_type[0]}{len(items) + 1}'
    if item_type == 'learning':
        new_entry = {
            'id': new_id, 'name': request.form.get('name', 'New Entry'),
            'role': request.form.get('role', 'Role'),
            'period': request.form.get('period', '2024'),
            'description': request.form.get('description', ''),
            'skills': [s.strip() for s in request.form.get('skills', '').split(',') if s.strip()],
            'color': request.form.get('color', '#CC785C'),
            'link': request.form.get('link') or None,
        }
    else:
        new_entry = {
            'id': new_id, 'name': request.form.get('name', 'New Hackathon'),
            'role': request.form.get('role', 'Participant'),
            'date': request.form.get('date', '2024'),
            'location': request.form.get('location', 'Online'),
            'description': request.form.get('description', ''),
            'project': request.form.get('project', ''),
            'link': request.form.get('link') or None,
        }
    data.setdefault(item_type, []).append(new_entry)
    write_json('experience.json', data)
    flash('Entry added.', 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/experience/delete/<item_type>/<item_id>', methods=['POST'])
@login_required
def admin_delete_experience(item_type, item_id):
    data = read_json('experience.json')
    data[item_type] = [item for item in data.get(item_type, []) if item['id'] != item_id]
    write_json('experience.json', data)
    flash('Entry deleted.', 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/site-config', methods=['POST'])
@login_required
def admin_site_config():
    config = read_json('siteConfig.json')
    config['hero']['status'] = request.form.get('hero_status', config['hero']['status'])
    config['hero']['name'] = request.form.get('hero_name', config['hero']['name'])
    config['hero']['subtitle'] = request.form.get('hero_subtitle', config['hero']['subtitle'])
    config['contact']['email'] = request.form.get('contact_email', config['contact']['email'])
    config['contact']['github'] = request.form.get('contact_github', config['contact']['github'])
    config['contact']['linkedin'] = request.form.get('contact_linkedin', config['contact']['linkedin'])
    config['analytics']['provider'] = request.form.get('analytics_provider', config['analytics'].get('provider', 'none'))
    config['analytics']['google_analytics_id'] = request.form.get('google_analytics_id', config['analytics'].get('google_analytics_id', ''))
    config['resume']['enabled'] = request.form.get('resume_enabled') == 'on'
    config['resume']['url'] = request.form.get('resume_url', config['resume'].get('url', ''))
    new_password = request.form.get('new_password', '').strip()
    if new_password:
        config['admin_password'] = new_password
    write_json('siteConfig.json', config)
    flash('Site settings updated.', 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/admin/messages/mark-read/<message_id>', methods=['POST'])
@login_required
def admin_mark_read(message_id):
    data = read_json('contactMessages.json')
    for msg in data.get('messages', []):
        if msg['id'] == message_id:
            msg['read'] = True
            break
    write_json('contactMessages.json', data)
    return jsonify({'ok': True})


@app.route('/admin/messages/delete/<message_id>', methods=['POST'])
@login_required
def admin_delete_message(message_id):
    data = read_json('contactMessages.json')
    data['messages'] = [m for m in data.get('messages', []) if m['id'] != message_id]
    write_json('contactMessages.json', data)
    flash('Message deleted.', 'success')
    return redirect(url_for('admin_dashboard'))


@app.route('/sitemap.xml')
def sitemap():
    pages = [
        {'loc': url_for('index', _external=True), 'priority': '1.0'},
        {'loc': url_for('projects', _external=True), 'priority': '0.8'},
        {'loc': url_for('experience', _external=True), 'priority': '0.8'},
        {'loc': url_for('about', _external=True), 'priority': '0.6'},
        {'loc': url_for('contact', _external=True), 'priority': '0.7'},
        {'loc': url_for('privacy', _external=True), 'priority': '0.3'},
        {'loc': url_for('terms', _external=True), 'priority': '0.3'},
    ]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for page in pages:
        xml += f'  <url>\n    <loc>{page["loc"]}</loc>\n    <priority>{page["priority"]}</priority>\n  </url>\n'
    xml += '</urlset>'
    response = make_response(xml)
    response.headers['Content-Type'] = 'application/xml'
    return response


@app.route('/robots.txt')
def robots():
    content = f'User-agent: *\nAllow: /\nSitemap: {url_for("sitemap", _external=True)}'
    response = make_response(content)
    response.headers['Content-Type'] = 'text/plain'
    return response


@app.route('/privacy')
def privacy():
    return render_template('privacy.html')


@app.route('/terms')
def terms():
    return render_template('terms.html')


@app.errorhandler(404)
def not_found(e):
    return render_template('errors/404.html'), 404


@app.errorhandler(500)
def server_error(e):
    return render_template('errors/500.html'), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=os.environ.get('FLASK_DEBUG', '1') == '1')
