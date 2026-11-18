import os
import urllib.parse
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file (either in backend/ or root)
backend_env = os.path.join(os.path.abspath(os.path.dirname(__file__)), '.env')
root_env = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), '.env')
if os.path.exists(backend_env):
    load_dotenv(backend_env)
elif os.path.exists(root_env):
    load_dotenv(root_env)
else:
    load_dotenv()

class Config:
    """Base application configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'learnlink-super-secret-dev-key-2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'learnlink-jwt-secret-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get('JWT_ACCESS_TOKEN_HOURS', 12)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.environ.get('JWT_REFRESH_TOKEN_DAYS', 30)))
    
    # Database configuration (defaults to PyMySQL driver for maximum cross-platform compatibility)
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '3306')
    DB_NAME = os.environ.get('DB_NAME', 'learnlink_db')

    _encoded_user = urllib.parse.quote_plus(DB_USER)
    _encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
    
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"mysql+pymysql://{_encoded_user}:{_encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True
    }

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
