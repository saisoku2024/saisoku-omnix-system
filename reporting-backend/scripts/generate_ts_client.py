import json
import os
import sys

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

def generate_typescript_defs():
    openapi_schema = app.openapi()
    
    # 1. Save OpenAPI JSON schema to frontend types directory
    frontend_types_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "reporting-dashboard", "types"))
    os.makedirs(frontend_types_dir, exist_ok=True)
    
    json_path = os.path.join(frontend_types_dir, "generated-api-schemas.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2)
    print(f"[SUCCESS] Generated OpenAPI JSON: {json_path}")

    # 2. Extract schemas and generate TypeScript interfaces
    ts_lines = [
        "/* eslint-disable */",
        "/**",
        " * Auto-generated TypeScript DTO definitions from FastAPI OpenAPI Schema.",
        " * Do not edit directly.",
        " */",
        "",
    ]

    components = openapi_schema.get("components", {}).get("schemas", {})
    type_mapping = {
        "string": "string",
        "integer": "number",
        "number": "number",
        "boolean": "boolean",
        "array": "Array<unknown>",
        "object": "Record<string, unknown>",
    }

    for model_name, model_def in components.items():
        ts_lines.append(f"export interface {model_name} {{")
        properties = model_def.get("properties", {})
        required_fields = set(model_def.get("required", []))

        for prop_name, prop_def in properties.items():
            prop_type = prop_def.get("type", "unknown")
            ts_type = type_mapping.get(prop_type, "unknown")
            
            # Handle array items
            if prop_type == "array" and "items" in prop_def:
                item_ref = prop_def["items"].get("$ref")
                if item_ref:
                    ts_type = f"Array<{item_ref.split('/')[-1]}>"

            optional_suffix = "" if prop_name in required_fields else "?"
            ts_lines.append(f"  {prop_name}{optional_suffix}: {ts_type};")
            
        ts_lines.append("}\n")

    ts_path = os.path.join(frontend_types_dir, "api.generated.ts")
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write("\n".join(ts_lines))
    print(f"[SUCCESS] Generated TypeScript DTOs: {ts_path}")

if __name__ == "__main__":
    generate_typescript_defs()
