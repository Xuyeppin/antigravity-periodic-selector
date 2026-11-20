"""Antigravity Periodic Model Selector cross-platform installer (Windows / Linux / macOS)."""
import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

SOURCE = Path(__file__).resolve().parent
HOME = Path.home()
PLUGIN_NAME = 'antigravity-periodic-selector'
PLUGIN_DIR = HOME / '.gemini' / 'config' / 'plugins' / PLUGIN_NAME
BACKUP_DIR = SOURCE / 'backups' / 'v1.6.0'
DEBUG_FLAGS = '--remote-debugging-port=0 --remote-debugging-address=127.0.0.1'
DATA_DIR = (
    Path(os.environ.get('LOCALAPPDATA', str(HOME / 'AppData' / 'Local'))) / 'AntigravityPeriodicSelector'
    if sys.platform == 'win32'
    else HOME / '.local' / 'share' / PLUGIN_NAME
)
RUNTIME_ITEMS = ('plugin.json', 'assets', 'compat', 'sidecars')


def configure_linux_desktop():
    """Ensure user-local antigravity.desktop on Linux includes loopback debugging flags for 2.33+."""
    if not sys.platform.startswith('linux'):
        return []
    user_apps = Path(os.environ.get('XDG_DATA_HOME', str(HOME / '.local' / 'share'))) / 'applications'
    system_candidates = [
        user_apps / 'antigravity.desktop',
        Path('/usr/share/applications/antigravity.desktop'),
        Path('/usr/local/share/applications/antigravity.desktop'),
    ]
    source_desktop = next((p for p in system_candidates if p.is_file()), None)
    if not source_desktop:
        return []
    text = source_desktop.read_text(encoding='utf-8', errors='replace')
    if '--remote-debugging-port' in text:
        return [str(source_desktop)]

    def patch_exec(match):
        line = match.group(0)
        if '%U' in line:
            return line.replace('%U', f'{DEBUG_FLAGS} %U')
        if '%F' in line:
            return line.replace('%F', f'{DEBUG_FLAGS} %F')
        return f'{line} {DEBUG_FLAGS}'

    patched = re.sub(r'^Exec=.*$', patch_exec, text, flags=re.MULTILINE)
    user_apps.mkdir(parents=True, exist_ok=True)
    target = user_apps / 'antigravity.desktop'
    target.write_text(patched, encoding='utf-8')
    return [str(target)]


def install():
    PLUGIN_DIR.mkdir(parents=True, exist_ok=True)
    for item in RUNTIME_ITEMS:
        src = SOURCE / item
        dst = PLUGIN_DIR / item
        if src.resolve() == dst.resolve():
            continue
        if src.is_dir():
            shutil.copytree(
                src, dst, dirs_exist_ok=True,
                ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '*.log', 'node_modules'),
            )
        else:
            shutil.copy2(src, dst)
    print(f'Installed: {PLUGIN_DIR}')
    if sys.platform.startswith('linux'):
        configured = configure_linux_desktop()
        if configured:
            print('Configured Linux .desktop launcher with loopback debugging flags:', ', '.join(configured))
        else:
            print(f'Note: On Antigravity 2.33+, start Antigravity with `{DEBUG_FLAGS}` or run `python3 manage.py launch`.')


def launch():
    args = ['--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1']
    if sys.platform == 'win32':
        exe = Path(os.environ.get('LOCALAPPDATA', str(HOME / 'AppData' / 'Local'))) / 'Programs' / 'antigravity' / 'Antigravity.exe'
        if not exe.is_file():
            raise RuntimeError(f'Antigravity executable not found at {exe}')
        subprocess.Popen([str(exe), *args], close_fds=True)
    elif sys.platform == 'darwin':
        subprocess.Popen(['/usr/bin/open', '-a', 'Antigravity', '--args', *args], close_fds=True)
    else:
        binary = shutil.which('antigravity') or '/usr/bin/antigravity'
        subprocess.Popen([binary, *args], close_fds=True)
    print('Launched Antigravity with loopback debugging flags.')


def rollback():
    if not BACKUP_DIR.exists():
        raise RuntimeError(f'Backup directory not found: {BACKUP_DIR}')
    for item in ('plugin.json', 'README.md', 'assets', 'compat', 'sidecars', 'tests'):
        src = BACKUP_DIR / item
        dst = SOURCE / item
        if not src.exists():
            continue
        if src.is_dir():
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
    install()
    print('Rolled back to v1.6.0 and reinstalled successfully.')


def uninstall():
    if PLUGIN_DIR.exists():
        resolved = PLUGIN_DIR.resolve()
        expected_parent = (HOME / '.gemini' / 'config' / 'plugins').resolve()
        if PLUGIN_DIR.is_symlink() or resolved.parent != expected_parent or resolved.name != PLUGIN_NAME:
            raise RuntimeError('Refusing to remove unexpected plugin path.')
        shutil.rmtree(resolved)
        print(f'Removed: {PLUGIN_DIR}')
    else:
        print('Plugin is not currently installed.')


def status():
    health_file = DATA_DIR / 'integration-state.json'
    health = {}
    if health_file.exists():
        try:
            health = json.loads(health_file.read_text(encoding='utf-8'))
        except Exception:
            health = {}
    print(json.dumps({
        'installed': (PLUGIN_DIR / 'plugin.json').exists(),
        'platform': sys.platform,
        'pluginDirectory': str(PLUGIN_DIR),
        'backupAvailable': BACKUP_DIR.exists(),
        'integration': health,
    }, ensure_ascii=False, indent=2))


def main():
    parser = argparse.ArgumentParser(description='Manage Antigravity Periodic Model Selector')
    parser.add_argument('command', choices=('install', 'uninstall', 'status', 'rollback', 'launch'))
    args = parser.parse_args()
    if args.command == 'install':
        install()
    elif args.command == 'uninstall':
        uninstall()
    elif args.command == 'status':
        status()
    elif args.command == 'rollback':
        rollback()
    elif args.command == 'launch':
        launch()


if __name__ == '__main__':
    main()
