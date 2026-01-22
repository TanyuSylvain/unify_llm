#!/usr/bin/env python3
"""
Create Desktop Launcher for UnifyLLM on Unix systems
This script creates desktop launchers for Linux and MacOS
"""

import os
import sys
import platform
from pathlib import Path
import shutil


def create_linux_launcher():
    """Create a .desktop file for Linux systems"""
    try:
        # Determine paths
        app_dir = Path(__file__).parent.parent.resolve()
        launcher_script = app_dir / "launcher.sh"
        icon_path = Path(__file__).parent / "icon.png"

        # Desktop entry content
        desktop_entry = f"""[Desktop Entry]
Type=Application
Version=1.0
Name=UnifyLLM
Comment=Multi-Agent Debate System for LLM Comparison
Exec={launcher_script}
Icon={icon_path if icon_path.exists() else ''}
Terminal=false
Categories=Development;Education;Science;
StartupNotify=true
Keywords=AI;LLM;Chat;Agent;
"""

        # Create .desktop file in multiple locations
        desktop_locations = []

        # 1. User's desktop
        desktop = Path.home() / "Desktop"
        if desktop.exists():
            desktop_file = desktop / "UnifyLLM.desktop"
            desktop_locations.append(desktop_file)

        # 2. Local applications directory
        local_apps = Path.home() / ".local" / "share" / "applications"
        local_apps.mkdir(parents=True, exist_ok=True)
        desktop_file_apps = local_apps / "UnifyLLM.desktop"
        desktop_locations.append(desktop_file_apps)

        # Write desktop files
        created_files = []
        for desktop_file in desktop_locations:
            try:
                with open(desktop_file, 'w') as f:
                    f.write(desktop_entry)
                # Make executable
                os.chmod(desktop_file, 0o755)
                created_files.append(str(desktop_file))
                print(f"✓ Created launcher: {desktop_file}")
            except Exception as e:
                print(f"Warning: Could not create launcher at {desktop_file}: {e}")

        # Update desktop database if available
        try:
            import subprocess
            subprocess.run(['update-desktop-database', str(local_apps)],
                         capture_output=True, timeout=5)
        except:
            pass

        if created_files:
            return True
        else:
            print("Warning: Could not create any desktop launchers")
            return False

    except Exception as e:
        print(f"Warning: Could not create desktop launcher: {e}")
        return False


def create_macos_launcher():
    """Create launcher for MacOS"""
    try:
        # For MacOS, we'll create a simple app bundle structure
        app_dir = Path(__file__).parent.parent.resolve()
        launcher_script = app_dir / "launcher.sh"

        # Create a simple shell script launcher that can be added to Dock
        macos_launcher = Path.home() / "Desktop" / "UnifyLLM.command"

        launcher_content = f"""#!/bin/bash
cd "{app_dir}"
./launcher.sh
"""

        try:
            with open(macos_launcher, 'w') as f:
                f.write(launcher_content)
            # Make executable
            os.chmod(macos_launcher, 0o755)
            print(f"✓ Created launcher: {macos_launcher}")
            print("  You can drag this to your Dock for easy access")
            return True
        except Exception as e:
            print(f"Warning: Could not create launcher: {e}")
            return False

    except Exception as e:
        print(f"Warning: Could not create MacOS launcher: {e}")
        return False


def main():
    """Main entry point"""
    if sys.platform == "win32":
        print("This script is for Unix systems (Linux/MacOS)")
        print("For Windows, use create_shortcut.py instead")
        return 1

    system = platform.system()

    if system == "Linux":
        print("Creating Linux desktop launcher...")
        return 0 if create_linux_launcher() else 1

    elif system == "Darwin":  # MacOS
        print("Creating MacOS launcher...")
        return 0 if create_macos_launcher() else 1

    else:
        print(f"Unsupported system: {system}")
        print("You can still launch UnifyLLM by running: ./launcher.sh")
        return 1


if __name__ == "__main__":
    sys.exit(main())
