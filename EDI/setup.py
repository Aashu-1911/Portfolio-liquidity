"""
setup.py — One-Command Setup Script
====================================
Automates the complete setup process for the upgraded system.

Usage:
    python setup.py
"""

import os
import sys
import subprocess
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def run_command(cmd, description):
    """Run a shell command and handle errors."""
    log.info(f"\n{'='*60}")
    log.info(f"{description}")
    log.info(f"{'='*60}")
    log.info(f"Command: {cmd}")
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        log.info("✓ Success")
        if result.stdout:
            log.info(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        log.error(f"✗ Failed: {e}")
        if e.stderr:
            log.error(e.stderr)
        return False


def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    log.info(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        log.error("Python 3.8 or higher is required!")
        return False
    
    log.info("✓ Python version compatible")
    return True


def install_dependencies():
    """Install required Python packages."""
    log.info("\n" + "="*60)
    log.info("INSTALLING DEPENDENCIES")
    log.info("="*60)
    
    # Check if requirements.txt exists
    if not os.path.exists("requirements.txt"):
        log.error("requirements.txt not found!")
        return False
    
    # Install packages
    cmd = f"{sys.executable} -m pip install -r requirements.txt"
    return run_command(cmd, "Installing Python packages...")


def setup_environment():
    """Create .env file template if it doesn't exist."""
    log.info("\n" + "="*60)
    log.info("SETTING UP ENVIRONMENT")
    log.info("="*60)
    
    env_file = ".env"
    
    if os.path.exists(env_file):
        log.info(f"✓ {env_file} already exists")
        return True
    
    # Create template
    template = """# OpenAI API Key (optional, for LLM features)
OPENAI_API_KEY=your_api_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
"""
    
    try:
        with open(env_file, 'w') as f:
            f.write(template)
        log.info(f"✓ Created {env_file} template")
        log.info("  → Edit this file to add your OpenAI API key")
        return True
    except Exception as e:
        log.error(f"Failed to create {env_file}: {e}")
        return False


def fetch_initial_data():
    """Fetch 5 years of historical data."""
    log.info("\n" + "="*60)
    log.info("FETCHING HISTORICAL DATA")
    log.info("="*60)
    log.info("This may take 10-30 minutes...")
    
    # Ask user for confirmation
    response = input("\nFetch 5 years of S&P 500 data now? (y/n): ").strip().lower()
    
    if response != 'y':
        log.info("Skipping data fetch. Run manually later:")
        log.info("  python pipeline_scheduler.py --setup")
        return True
    
    # Run pipeline setup
    cmd = f"{sys.executable} pipeline_scheduler.py --setup"
    return run_command(cmd, "Fetching and processing data...")


def verify_installation():
    """Verify that all components are working."""
    log.info("\n" + "="*60)
    log.info("VERIFYING INSTALLATION")
    log.info("="*60)
    
    checks = []
    
    # Check if key files exist
    files = [
        "app.py",
        "data_ingestion.py",
        "feature_engineering.py",
        "prediction_engine.py",
        "llm_reasoning.py",
        "pipeline_scheduler.py"
    ]
    
    for file in files:
        if os.path.exists(file):
            log.info(f"✓ {file}")
            checks.append(True)
        else:
            log.error(f"✗ {file} not found")
            checks.append(False)
    
    # Try importing modules
    try:
        import flask
        import numpy
        import pandas
        import sklearn
        import yfinance
        log.info("✓ Core dependencies installed")
        checks.append(True)
    except ImportError as e:
        log.error(f"✗ Missing dependency: {e}")
        checks.append(False)
    
    return all(checks)


def print_next_steps():
    """Print instructions for next steps."""
    log.info("\n" + "="*70)
    log.info("✅ SETUP COMPLETE!")
    log.info("="*70)
    
    print("""
Next Steps:
-----------

1. (Optional) Add your OpenAI API key to .env file:
   OPENAI_API_KEY=your_key_here

2. If you skipped data fetch, run initial setup:
   python pipeline_scheduler.py --setup

3. Start the Flask API server:
   python app.py

4. Test the API:
   curl http://localhost:5000/health

5. Set up daily automation (choose one):
   
   a) Run once manually:
      python pipeline_scheduler.py --once
   
   b) Schedule daily at 5 PM:
      python pipeline_scheduler.py --schedule 17:00
   
   c) Run as daemon (every 24 hours):
      python pipeline_scheduler.py --daemon

6. Read the documentation:
   README_UPGRADE.md

For more information, see README_UPGRADE.md
""")


def main():
    """Main setup orchestrator."""
    print("="*70)
    print("  PORTFOLIO LIQUIDITY PREDICTION SYSTEM — SETUP")
    print("="*70)
    print("\nThis script will:")
    print("  1. Check Python version")
    print("  2. Install dependencies")
    print("  3. Set up environment")
    print("  4. (Optional) Fetch historical data")
    print("  5. Verify installation")
    print()
    
    response = input("Continue? (y/n): ").strip().lower()
    if response != 'y':
        print("Setup cancelled.")
        return
    
    # Run setup steps
    steps = [
        ("Checking Python version", check_python_version),
        ("Installing dependencies", install_dependencies),
        ("Setting up environment", setup_environment),
        ("Fetching initial data", fetch_initial_data),
        ("Verifying installation", verify_installation),
    ]
    
    for description, func in steps:
        if not func():
            log.error(f"\n❌ Setup failed at: {description}")
            log.error("Please fix the errors and run setup again.")
            sys.exit(1)
    
    # Print next steps
    print_next_steps()


if __name__ == "__main__":
    main()
