import os
import base64
import numpy as np
from flask import Flask, request, jsonify
from PIL import Image
import io
import cv2
from sklearn.cluster import KMeans

app = Flask(__name__)

CATEGORIES = [
    'shirts', 't-shirts', 'dresses', 'pants', 'shorts', 
    'skirt', 'jacket', 'coat', 'sweater', 'hoodie',
    'shoes', 'sneakers', 'boots', 'accessories', 'outerwear'
]

def load_image_from_url(url):
    try:
        import requests
        response = requests.get(url, timeout=10)
        img = Image.open(io.BytesIO(response.content))
        return img.convert('RGB')
    except Exception as e:
        return None

def classify_clothing(image):
    """Mock classification - in production, use trained model"""
    np.random.seed(hash(str(image.size)) % 2**32
    
    predictions = []
    for cat in CATEGORIES:
        confidence = np.random.random() * 0.4
        predictions.append({'category': cat, 'confidence': min(0.95, confidence)})
    
    predictions.sort(key=lambda x: x['confidence'], reverse=True)
    return predictions[:5]

def extract_colors(image, n_colors=5):
    """Extract dominant colors using K-means clustering"""
    img = image.resize((100, 100))
    arr = np.array(img)
    pixels = arr.reshape(-1, 3)
    
    try:
        kmeans = KMeans(n_clusters=n_colors, n_init=10, random_state=42)
        kmeans.fit(pixels)
        
        colors = []
        for i, (color, label) in enumerate(zip(kmeans.cluster_centers_, 
                                             np.bincount(kmeans.labels_))):
            percentage = label / len(pixels) * 100
            hex_color = '#{:02x}{:02x}{:02x}'.format(
                int(color[0]), int(color[1]), int(color[2])
            )
            colors.append({
                'hex': hex_color,
                'name': get_color_name(hex_color),
                'percentage': round(percentage, 2)
            })
        
        colors.sort(key=lambda x: x['percentage'], reverse=True)
        return colors
    except Exception as e:
        return [{'hex': '#000000', 'name': 'Black', 'percentage': 100}]

def get_color_name(hex_color):
    """Get human-readable color name"""
    color_names = {
        '#000000': 'Black', '#FFFFFF': 'White', '#FF0000': 'Red',
        '#00FF00': 'Green', '#0000FF': 'Blue', '#FFFF00': 'Yellow',
        '#FFA500': 'Orange', '#800080': 'Purple', '#FFC0CB': 'Pink',
        '#808080': 'Gray', '#A52A2A': 'Brown', '#000080': 'Navy',
        '#008080': 'Teal', '#FFE4C4': 'Beige', '#E6E6FA': 'Lavender'
    }
    return color_names.get(hex_color, 'Unknown')

def calculate_compatibility(item1, item2):
    """Calculate outfit compatibility score"""
    base_score = 0.65
    
    if item1.get('category') and item2.get('category'):
        tops = ['shirts', 't-shirts', 'dresses', 'sweaters', 'hoodie']
        bottoms = ['pants', 'shorts', 'skirts']
        
        cat1, cat2 = item1.get('category'), item2.get('category')
        
        if cat1 in tops and cat2 in bottoms:
            base_score += 0.2
        elif cat1 in bottoms and cat2 in tops:
            base_score += 0.2
        elif cat1 == cat2:
            base_score -= 0.3
    
    colors1 = item1.get('colors', [])
    colors2 = item2.get('colors', [])
    
    if colors1 and colors2:
        for c1 in colors1[:2]:
            for c2 in colors2[:2]:
                if c1.get('hex') and c2.get('hex'):
                    if c1['hex'] != c2['hex']:
                        base_score += 0.05
    
    return min(0.98, max(0.5, base_score + np.random.random() * 0.1))

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/classify', methods=['POST'])
def classify():
    data = request.get_json()
    image_url = data.get('imageUrl')
    
    if not image_url:
        return jsonify({'error': 'imageUrl required'}), 400
    
    image = load_image_from_url(image_url)
    if not image:
        return jsonify({'error': 'Could not load image'}), 400
    
    predictions = classify_clothing(image)
    
    return jsonify({
        'category': predictions[0]['category'],
        'confidence': predictions[0]['confidence'],
        'allPredictions': predictions
    })

@app.route('/extract-colors', methods=['POST'])
def extract_colors_route():
    data = request.get_json()
    image_url = data.get('imageUrl')
    
    if not image_url:
        return jsonify({'error': 'imageUrl required'}), 400
    
    image = load_image_from_url(image_url)
    if not image:
        return jsonify({'error': 'Could not load image'}), 400
    
    colors = extract_colors(image)
    
    return jsonify({
        'dominantColor': colors[0]['hex'],
        'colors': colors
    })

@app.route('/compatibility', methods=['POST'])
def compatibility():
    data = request.get_json()
    items = data.get('items', [])
    
    if len(items) < 2:
        return jsonify({'error': 'At least 2 items required'}), 400
    
    scores = []
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            score = calculate_compatibility(items[i], items[j])
            scores.append(score)
    
    avg_score = np.mean(scores) if scores else 0.7
    
    reasons = []
    if avg_score > 0.75:
        reasons.append('Excellent color coordination')
    if avg_score > 0.7:
        reasons.append('Style elements complement well')
    reasons.append('Appropriate for various occasions')
    
    return jsonify({
        'compatibilityScore': round(avg_score, 3),
        'reasons': reasons
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)