"""SKINSIGHT v2 — Recommendation Engine"""

RECOMMENDATIONS = {
    "acne": {
        "label": "Acne-Prone Skin", "severity": "moderate",
        "description": "Your live scan suggests acne-prone skin. Acne forms when hair follicles clog with oil and dead skin cells.",
        "morning_routine": ["Gentle foaming cleanser (salicylic acid 0.5–2%)", "Alcohol-free niacinamide toner", "Lightweight oil-free moisturizer", "Broad-spectrum SPF 30+ (gel or fluid)"],
        "night_routine": ["Micellar water pre-cleanse + salicylic acid cleanser", "BHA exfoliant 2–3× per week", "Benzoyl peroxide spot treatment (2.5–5%)", "Oil-free hydrating gel moisturizer"],
        "products": [
            {"name": "CeraVe Salicylic Acid Foaming Cleanser", "brand": "CeraVe", "ingredient": "Salicylic Acid 2%", "purpose": "Unclogs pores", "dermatologist_recommendation": "Recommended by the American Academy of Dermatology for acne-prone skin"},
            {"name": "The Ordinary Niacinamide 10% + Zinc 1%", "brand": "The Ordinary", "ingredient": "Niacinamide 10%", "purpose": "Reduces sebum & redness", "dermatologist_recommendation": "Clinically proven to regulate oil production and minimize pores"},
            {"name": "Neutrogena On-The-Spot Acne Treatment", "brand": "Neutrogena", "ingredient": "Benzoyl Peroxide 5%", "purpose": "Kills acne bacteria", "dermatologist_recommendation": "FDA-approved for acne treatment by board-certified dermatologists"},
            {"name": "CeraVe Hydrating Facial Moisturizer PM", "brand": "CeraVe", "ingredient": "Hyaluronic Acid, Ceramides", "purpose": "Hydrates without clogging", "dermatologist_recommendation": "Non-comedogenic formula recommended for acne-prone skin"},
        ],
        "preventive_tips": ["Change pillowcases every 2–3 days", "Never touch your face with unwashed hands", "Keep hair products away from forehead", "Clean your phone screen daily"],

        "ingredients_to_avoid": ["Coconut oil", "Isopropyl myristate", "Lanolin"],
        "consult_dermatologist": False,
    },
    "oily": {
        "label": "Oily Skin", "severity": "mild",
        "description": "Your scan shows oily skin. Overactive sebaceous glands produce excess sebum, causing shine and enlarged pores.",
        "morning_routine": ["Foaming or gel cleanser", "Niacinamide toner", "Lightweight water-based serum", "Mattifying oil-free SPF 30+"],
        "night_routine": ["Gentle gel cleanser", "AHA toner 2× per week", "Niacinamide serum", "Thin oil-free gel moisturizer"],
        "products": [
            {"name": "Neutrogena Hydro Boost Hydrating Cleansing Gel", "brand": "Neutrogena", "ingredient": "Zinc PCA, Hyaluronic Acid", "purpose": "Reduces excess oil", "dermatologist_recommendation": "Oil-free formula trusted by dermatologists for oily skin"},
            {"name": "Olay Regenerist Niacinamide Serum", "brand": "Olay", "ingredient": "Niacinamide 5%", "purpose": "Regulates sebum production", "dermatologist_recommendation": "Clinically proven to minimize pores and mattify skin"},
            {"name": "Aztec Secret Indian Healing Clay", "brand": "Aztec Secret", "ingredient": "Kaolin Clay", "purpose": "Deep pore cleansing (weekly)", "dermatologist_recommendation": "Natural clay endorsed by dermatologists for oil control"},
        ],
        "preventive_tips": ["Blotting papers > powder throughout the day", "Avoid over-washing (worsens oiliness)", "Lukewarm water only", "Minimal product layering"],

        "ingredients_to_avoid": ["Heavy oils", "Petrolatum in large amounts"],
        "consult_dermatologist": False,
    },
    "dry": {
        "label": "Dry Skin", "severity": "mild",
        "description": "Your scan indicates dry skin. The skin barrier is compromised, leading to tightness, flaking, and sensitivity.",
        "morning_routine": ["Creamy gentle cleanser", "Ceramide hydrating toner", "Hyaluronic acid serum on damp skin", "Rich ceramide moisturizer", "Moisturizing SPF 30+"],
        "night_routine": ["Oil or balm cleanser", "Glycerin hydrating toner", "Peptide serum or low-strength retinol (0.025%) 2×/week", "Rich night cream with ceramides"],
        "products": [
            {"name": "CeraVe Hydrating Facial Cleanser", "brand": "CeraVe", "ingredient": "Ceramides, Glycerin", "purpose": "Cleanses without stripping", "dermatologist_recommendation": "AAD-recommended for sensitive and dry skin types"},
            {"name": "Hylamide SubQ Skin Hydration Serum", "brand": "Hylamide", "ingredient": "Multi-weight Hyaluronic Acid", "purpose": "Deep hydration", "dermatologist_recommendation": "Advanced HA complex recommended by skin specialists"},
            {"name": "CeraVe Moisturizing Cream", "brand": "CeraVe", "ingredient": "Ceramides, Hyaluronic Acid, Niacinamide", "purpose": "Restores skin barrier", "dermatologist_recommendation": "Barrier-repair formula endorsed by dermatologists"},
        ],
        "preventive_tips": ["Use a bedroom humidifier at night", "Lukewarm — never hot — showers", "Pat dry, never rub", "Moisturize within 60 seconds of washing"],

        "ingredients_to_avoid": ["Alcohol denat", "Fragrance/parfum", "SLS"],
        "consult_dermatologist": False,
    },
    "normal": {
        "label": "Normal / Balanced Skin", "severity": "none",
        "description": "Excellent! Your skin appears balanced and healthy. Focus on maintenance and long-term prevention.",
        "morning_routine": ["Gentle pH-balanced cleanser", "Vitamin C antioxidant serum", "Lightweight moisturizer", "Broad-spectrum SPF 30+"],
        "night_routine": ["Gentle cleanser", "Retinol serum (0.025–0.1%) 2–3×/week", "Lightweight moisturizer"],
        "products": [
            {"name": "Cetaphil Gentle Skin Cleanser", "brand": "Cetaphil", "ingredient": "Amino Acids, Aloe Vera", "purpose": "Maintains pH balance", "dermatologist_recommendation": "Most recommended cleanser by dermatologists worldwide"},
            {"name": "SkinCeuticals C E Ferulic", "brand": "SkinCeuticals", "ingredient": "L-Ascorbic Acid 15%", "purpose": "Brightening & antioxidant", "dermatologist_recommendation": "Gold-standard vitamin C serum recommended by skin specialists"},
            {"name": "Olay Regenerist Retinol24 Nighttime Serum", "brand": "Olay", "ingredient": "Retinol + Hyaluronic Acid", "purpose": "Anti-aging & hydration", "dermatologist_recommendation": "Clinical studies show visible improvements in fine lines"},
        ],
        "preventive_tips": ["SPF daily — UV is the #1 skin ager", "Gentle exfoliation 1–2×/week", "Introduce new products one at a time", "Stay consistent"],

        "ingredients_to_avoid": [],
        "consult_dermatologist": False,
    },
}

def get_recommendation(condition: str) -> dict:
    return RECOMMENDATIONS.get(condition, RECOMMENDATIONS["normal"])
