import pytest
from app import app as flask_app


@pytest.fixture
def app():
    flask_app.config['TESTING'] = True
    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()


def test_index_returns_200(client):
    rv = client.get('/')
    assert rv.status_code == 200


def test_projects_returns_200(client):
    rv = client.get('/projects')
    assert rv.status_code == 200


def test_experience_returns_200(client):
    rv = client.get('/experience')
    assert rv.status_code == 200


def test_contact_returns_200(client):
    rv = client.get('/contact')
    assert rv.status_code == 200


def test_about_returns_200(client):
    rv = client.get('/about')
    assert rv.status_code == 200


def test_404_returns_correct_status(client):
    rv = client.get('/nonexistent-page-12345')
    assert rv.status_code == 404


def test_contact_submit_validation(client):
    rv = client.post('/contact/submit', data={
        'name': '', 'email': '', 'message': ''
    }, follow_redirects=True)
    assert rv.status_code == 200


def test_admin_redirects_when_not_logged_in(client):
    rv = client.get('/admin/dashboard', follow_redirects=True)
    assert rv.status_code == 200


def test_sitemap_returns_200(client):
    rv = client.get('/sitemap.xml')
    assert rv.status_code == 200


def test_robots_returns_200(client):
    rv = client.get('/robots.txt')
    assert rv.status_code == 200
