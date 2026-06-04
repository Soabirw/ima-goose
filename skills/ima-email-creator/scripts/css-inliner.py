#!/usr/bin/env python3
"""
Inline <style> blocks into element style attributes.

Uses premailer to handle CSS specificity correctly. Designed for emails
built with style blocks (e.g. BeeFree exports) that need inlining for
Gmail compatibility.

Usage:
    python3 css-inliner.py input.html
    python3 css-inliner.py input.html --out output.html
"""

import argparse
import sys
import premailer


def inline_css(html: str) -> str:
    return premailer.transform(
        html,
        remove_classes=False,
        strip_important=True,
        keep_style_tags=False,
    )


def main():
    parser = argparse.ArgumentParser(description="Inline CSS for email compatibility")
    parser.add_argument("input", help="Input HTML file")
    parser.add_argument("--out", help="Output file (default: stdout)")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        html = f.read()

    result = inline_css(html)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(result)
    else:
        sys.stdout.write(result)


if __name__ == "__main__":
    main()
