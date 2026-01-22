#!/usr/bin/env python3
"""
UnifyLLM Configuration Wizard
A GUI tool for configuring API keys for various LLM providers
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import os
import sys
from pathlib import Path
import webbrowser


class ConfigWizard:
    """Configuration wizard for UnifyLLM API keys"""

    # Provider configuration
    PROVIDERS = {
        'MISTRAL': {
            'name': 'Mistral AI',
            'url': 'https://console.mistral.ai/',
            'key_var': 'MISTRAL_API_KEY',
            'base_url_var': None,
            'default_base_url': None,
            'description': 'Mistral AI provides powerful language models'
        },
        'QWEN': {
            'name': 'Alibaba Qwen (DashScope)',
            'url': 'https://dashscope.aliyuncs.com/',
            'key_var': 'QWEN_API_KEY',
            'base_url_var': 'QWEN_BASE_URL',
            'default_base_url': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
            'description': 'Qwen models from Alibaba Cloud'
        },
        'GLM': {
            'name': 'Zhipu GLM',
            'url': 'https://open.bigmodel.cn/',
            'key_var': 'GLM_API_KEY',
            'base_url_var': 'GLM_BASE_URL',
            'default_base_url': 'https://open.bigmodel.cn/api/paas/v4',
            'description': 'GLM models from Zhipu AI'
        },
        'MINIMAX': {
            'name': 'MiniMax',
            'url': 'https://www.minimaxi.com/',
            'key_var': 'MINIMAX_API_KEY',
            'base_url_var': 'MINIMAX_BASE_URL',
            'default_base_url': 'https://api.minimax.io/v1',
            'description': 'MiniMax AI platform'
        },
        'DEEPSEEK': {
            'name': 'DeepSeek',
            'url': 'https://platform.deepseek.com/',
            'key_var': 'DEEPSEEK_API_KEY',
            'base_url_var': 'DEEPSEEK_BASE_URL',
            'default_base_url': 'https://api.deepseek.com',
            'description': 'DeepSeek AI models'
        },
        'OPENAI': {
            'name': 'OpenAI / OpenAI-compatible',
            'url': 'https://platform.openai.com/api-keys',
            'key_var': 'OPENAI_API_KEY',
            'base_url_var': 'OPENAI_BASE_URL',
            'default_base_url': 'https://api.openai.com/v1',
            'description': 'OpenAI GPT models or compatible APIs'
        },
        'GEMINI': {
            'name': 'Google Gemini',
            'url': 'https://makersuite.google.com/app/apikey',
            'key_var': 'GEMINI_API_KEY',
            'base_url_var': 'GEMINI_BASE_URL',
            'default_base_url': 'https://generativelanguage.googleapis.com',
            'description': 'Google Gemini models'
        }
    }

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("UnifyLLM Configuration Wizard")
        self.root.geometry("700x800")
        self.root.resizable(False, False)

        # Configure style
        style = ttk.Style()
        style.theme_use('clam')

        # Store API keys
        self.api_keys = {}
        self.key_entries = {}

        # Load existing configuration if available
        self.load_existing_config()

        # Create UI
        self.create_ui()

    def load_existing_config(self):
        """Load existing configuration from .env file if it exists"""
        env_path = Path(__file__).parent.parent / ".env"
        if env_path.exists():
            try:
                with open(env_path, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            self.api_keys[key.strip()] = value.strip()
            except Exception as e:
                print(f"Warning: Could not load existing config: {e}")

    def create_ui(self):
        """Create the user interface"""
        # Header
        header_frame = tk.Frame(self.root, bg='#2c3e50', height=80)
        header_frame.pack(fill=tk.X)
        header_frame.pack_propagate(False)

        title_label = tk.Label(
            header_frame,
            text="UnifyLLM Configuration",
            font=('Arial', 20, 'bold'),
            bg='#2c3e50',
            fg='white'
        )
        title_label.pack(pady=20)

        # Instructions
        instruction_frame = tk.Frame(self.root, bg='#ecf0f1')
        instruction_frame.pack(fill=tk.X, pady=10)

        instruction_text = tk.Label(
            instruction_frame,
            text="Configure at least one API key to use UnifyLLM.\nYou can add more providers later by editing the .env file.",
            font=('Arial', 10),
            bg='#ecf0f1',
            fg='#2c3e50',
            justify=tk.LEFT,
            wraplength=650
        )
        instruction_text.pack(padx=20, pady=10)

        # Scrollable frame for providers
        canvas_frame = tk.Frame(self.root)
        canvas_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        canvas = tk.Canvas(canvas_frame, bg='white', highlightthickness=0)
        scrollbar = ttk.Scrollbar(canvas_frame, orient=tk.VERTICAL, command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='white')

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Add provider configuration sections
        for provider_id, provider_info in self.PROVIDERS.items():
            self.create_provider_section(scrollable_frame, provider_id, provider_info)

        # Status bar
        self.status_frame = tk.Frame(self.root, bg='#ecf0f1', height=40)
        self.status_frame.pack(fill=tk.X)
        self.status_frame.pack_propagate(False)

        self.status_label = tk.Label(
            self.status_frame,
            text=self.get_status_text(),
            font=('Arial', 10),
            bg='#ecf0f1',
            fg='#2c3e50'
        )
        self.status_label.pack(pady=10)

        # Bottom buttons
        button_frame = tk.Frame(self.root, bg='white')
        button_frame.pack(fill=tk.X, pady=10)

        skip_button = ttk.Button(
            button_frame,
            text="Skip for Now",
            command=self.skip_config,
            width=15
        )
        skip_button.pack(side=tk.LEFT, padx=20)

        save_button = ttk.Button(
            button_frame,
            text="Save Configuration",
            command=self.save_config,
            width=20
        )
        save_button.pack(side=tk.RIGHT, padx=20)

    def create_provider_section(self, parent, provider_id, provider_info):
        """Create a configuration section for a provider"""
        # Provider frame
        provider_frame = tk.LabelFrame(
            parent,
            text=provider_info['name'],
            font=('Arial', 11, 'bold'),
            bg='white',
            padx=10,
            pady=10
        )
        provider_frame.pack(fill=tk.X, padx=10, pady=5)

        # Description
        desc_label = tk.Label(
            provider_frame,
            text=provider_info['description'],
            font=('Arial', 9),
            bg='white',
            fg='#7f8c8d',
            justify=tk.LEFT
        )
        desc_label.pack(anchor=tk.W, pady=(0, 5))

        # API Key entry
        key_frame = tk.Frame(provider_frame, bg='white')
        key_frame.pack(fill=tk.X, pady=5)

        key_label = tk.Label(
            key_frame,
            text="API Key:",
            font=('Arial', 10),
            bg='white',
            width=10,
            anchor=tk.W
        )
        key_label.pack(side=tk.LEFT)

        # Get existing value if available
        existing_value = self.api_keys.get(provider_info['key_var'], '')

        key_entry = tk.Entry(
            key_frame,
            font=('Arial', 10),
            width=50,
            show='*'
        )
        key_entry.insert(0, existing_value)
        key_entry.pack(side=tk.LEFT, padx=5)

        # Store reference
        self.key_entries[provider_info['key_var']] = key_entry

        # Show/Hide button
        show_var = tk.BooleanVar(value=False)

        def toggle_password():
            if show_var.get():
                key_entry.config(show='')
            else:
                key_entry.config(show='*')

        show_button = ttk.Checkbutton(
            key_frame,
            text="Show",
            variable=show_var,
            command=toggle_password,
            width=8
        )
        show_button.pack(side=tk.LEFT)

        # Get API key link
        link_label = tk.Label(
            provider_frame,
            text=f"Get your API key",
            font=('Arial', 9, 'underline'),
            bg='white',
            fg='#3498db',
            cursor='hand2'
        )
        link_label.pack(anchor=tk.W, pady=(0, 5))
        link_label.bind('<Button-1>', lambda e: webbrowser.open(provider_info['url']))

        # Base URL if applicable
        if provider_info['base_url_var']:
            url_frame = tk.Frame(provider_frame, bg='white')
            url_frame.pack(fill=tk.X, pady=5)

            url_label = tk.Label(
                url_frame,
                text="Base URL:",
                font=('Arial', 9),
                bg='white',
                width=10,
                anchor=tk.W
            )
            url_label.pack(side=tk.LEFT)

            existing_url = self.api_keys.get(
                provider_info['base_url_var'],
                provider_info['default_base_url']
            )

            url_entry = tk.Entry(
                url_frame,
                font=('Arial', 9),
                width=50
            )
            url_entry.insert(0, existing_url)
            url_entry.pack(side=tk.LEFT, padx=5)

            # Store reference
            self.key_entries[provider_info['base_url_var']] = url_entry

    def get_status_text(self):
        """Get status text showing how many providers are configured"""
        configured = sum(
            1 for provider_info in self.PROVIDERS.values()
            if self.key_entries.get(provider_info['key_var'], None) and
            self.key_entries[provider_info['key_var']].get().strip() and
            self.key_entries[provider_info['key_var']].get().strip() not in ['your_', '']
        )
        return f"Status: {configured}/{len(self.PROVIDERS)} providers configured"

    def save_config(self):
        """Save configuration to .env file"""
        # Collect all entries
        config_data = {}
        has_valid_key = False

        for key_var, entry in self.key_entries.items():
            value = entry.get().strip()
            if value and not value.startswith('your_'):
                config_data[key_var] = value
                # Check if this is an API key (not a base URL)
                if key_var.endswith('_API_KEY'):
                    has_valid_key = True

        # Validate at least one API key is configured
        if not has_valid_key:
            messagebox.showwarning(
                "No API Keys Configured",
                "Please configure at least one API key to use UnifyLLM.\n\n"
                "You can click 'Skip for Now' if you want to configure later."
            )
            return

        # Save to .env file
        env_path = Path(__file__).parent.parent / ".env"

        try:
            with open(env_path, 'w') as f:
                f.write("# UnifyLLM API Configuration\n")
                f.write("# Generated by Configuration Wizard\n\n")

                # Write configuration for each provider
                for provider_id, provider_info in self.PROVIDERS.items():
                    key_var = provider_info['key_var']

                    if key_var in config_data:
                        f.write(f"# {provider_info['name']}\n")
                        f.write(f"{key_var}={config_data[key_var]}\n")

                        # Write base URL if applicable
                        if provider_info['base_url_var']:
                            base_url_var = provider_info['base_url_var']
                            if base_url_var in config_data:
                                f.write(f"{base_url_var}={config_data[base_url_var]}\n")

                        f.write("\n")

            messagebox.showinfo(
                "Configuration Saved",
                f"Configuration saved successfully!\n\n"
                f"{len([k for k in config_data.keys() if k.endswith('_API_KEY')])} API key(s) configured.\n\n"
                f"You can edit the configuration later by editing:\n{env_path}"
            )
            self.root.quit()

        except Exception as e:
            messagebox.showerror(
                "Save Error",
                f"Failed to save configuration:\n{str(e)}"
            )

    def skip_config(self):
        """Skip configuration for now"""
        result = messagebox.askyesno(
            "Skip Configuration",
            "Are you sure you want to skip configuration?\n\n"
            "You will need to manually configure API keys in the .env file\n"
            "before you can use UnifyLLM."
        )

        if result:
            # Create empty .env file with template
            env_path = Path(__file__).parent.parent / ".env"
            template_path = Path(__file__).parent.parent / ".env.template"

            if template_path.exists() and not env_path.exists():
                try:
                    import shutil
                    shutil.copy(template_path, env_path)
                except Exception:
                    pass

            self.root.quit()

    def run(self):
        """Run the configuration wizard"""
        self.root.mainloop()


def main():
    """Main entry point"""
    try:
        wizard = ConfigWizard()
        wizard.run()
        return 0
    except KeyboardInterrupt:
        print("\nConfiguration cancelled by user")
        return 1
    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
