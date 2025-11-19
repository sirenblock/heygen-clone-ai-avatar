#!/usr/bin/env python3
"""Generate PWA icons with SVG-based graphics"""

from PIL import Image, ImageDraw
import os

def create_gradient_icon(size):
    """Create an icon with gradient background and geometric shape"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background with gradient simulation
    # Using purple to pink gradient colors
    colors = [
        (139, 92, 246),   # Primary purple
        (124, 58, 237),   # Mid purple
        (219, 39, 119),   # Pink-purple
        (236, 72, 153)    # Secondary pink
    ]

    # Create gradient effect by drawing multiple rectangles
    for i in range(size):
        ratio = i / size
        if ratio < 0.33:
            # Interpolate between color 0 and 1
            r_ratio = ratio / 0.33
            r = int(colors[0][0] * (1 - r_ratio) + colors[1][0] * r_ratio)
            g = int(colors[0][1] * (1 - r_ratio) + colors[1][1] * r_ratio)
            b = int(colors[0][2] * (1 - r_ratio) + colors[1][2] * r_ratio)
        elif ratio < 0.66:
            # Interpolate between color 1 and 2
            r_ratio = (ratio - 0.33) / 0.33
            r = int(colors[1][0] * (1 - r_ratio) + colors[2][0] * r_ratio)
            g = int(colors[1][1] * (1 - r_ratio) + colors[2][1] * r_ratio)
            b = int(colors[1][2] * (1 - r_ratio) + colors[2][2] * r_ratio)
        else:
            # Interpolate between color 2 and 3
            r_ratio = (ratio - 0.66) / 0.34
            r = int(colors[2][0] * (1 - r_ratio) + colors[3][0] * r_ratio)
            g = int(colors[2][1] * (1 - r_ratio) + colors[3][1] * r_ratio)
            b = int(colors[2][2] * (1 - r_ratio) + colors[3][2] * r_ratio)

        draw.line([(0, i), (size, i)], fill=(r, g, b, 255))

    # Draw rounded corners
    corner_radius = int(size * 0.15)

    # Create a mask for rounded corners
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (size, size)], corner_radius, fill=255)

    # Apply mask
    img.putalpha(mask)

    # Draw geometric shape (hexagon/diamond in center)
    center = size // 2
    shape_size = size * 0.35

    # Draw hexagon points
    points = []
    import math
    for i in range(6):
        angle = math.pi / 3 * i - math.pi / 2
        x = center + shape_size * math.cos(angle)
        y = center + shape_size * math.sin(angle)
        points.append((x, y))

    # Draw hexagon with white fill and opacity
    overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.polygon(points, fill=(255, 255, 255, 230))

    # Composite the overlay
    img = Image.alpha_composite(img, overlay)

    return img

def main():
    """Generate icon files"""
    os.chdir('/Users/lsd/msclaude/projects/heygen clone/public')

    # Generate 192x192 icon
    icon_192 = create_gradient_icon(192)
    icon_192.save('icon-192.png', 'PNG')
    print('✓ Created icon-192.png')

    # Generate 512x512 icon
    icon_512 = create_gradient_icon(512)
    icon_512.save('icon-512.png', 'PNG')
    print('✓ Created icon-512.png')

    # Also create apple-touch-icon (180x180)
    icon_180 = create_gradient_icon(180)
    icon_180.save('apple-touch-icon.png', 'PNG')
    print('✓ Created apple-touch-icon.png')

    print('\nAll PWA icons generated successfully!')

if __name__ == '__main__':
    main()
