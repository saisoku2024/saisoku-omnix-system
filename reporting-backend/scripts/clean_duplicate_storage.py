import sys
import os
import posixpath
import re
from collections import defaultdict

# Add parent dir to sys.path so app modules can be loaded
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.supabase import supabase

def list_all_files_in_bucket(bucket_name: str, prefix: str = "") -> list:
    """Lists all files in a bucket recursively."""
    all_files = []
    try:
        items = supabase.storage.from_(bucket_name).list(prefix, {"limit": 1000})
    except Exception as e:
        print(f"Error listing {bucket_name}/{prefix}: {e}")
        return all_files

    for item in items or []:
        name = item.get("name")
        if not name:
            continue
        full_path = f"{prefix}/{name}".lstrip("/")
        # Check if item is a folder or has id
        if item.get("id") is None and item.get("metadata") is None:
            # Folder -> recurse
            all_files.extend(list_all_files_in_bucket(bucket_name, full_path))
        else:
            item["full_path"] = full_path
            all_files.append(item)
    return all_files

def clean_knowledge_storage_duplicates():
    print("\n=== 1. PEMBERSIHAN FILE FISIK DUPLIKAT DI BUCKET 'knowledge-files' ===")
    files = list_all_files_in_bucket("knowledge-files", "")
    print(f"Total file fisik ditemukan di storage 'knowledge-files': {len(files)}")
    
    # Kelompokkan berdasarkan original filename
    grouped = defaultdict(list)
    for f in files:
        path = f["full_path"]
        # Extract filename after the 32-hex hash prefix if present
        match = re.search(r"[0-9a-fA-F]{32}-(.*)$", path)
        orig_name = match.group(1) if match else posixpath.basename(path)
        grouped[orig_name].append(f)
        
    files_to_delete = []
    total_freed_bytes = 0
    
    for orig_name, file_list in grouped.items():
        if len(file_list) > 1:
            # Urutkan berdasarkan created_at desc
            file_list.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            newest = file_list[0]
            duplicates = file_list[1:]
            print(f"\n[DUPLIKAT STORAGE] {orig_name}")
            print(f"  -> KEEP (Terbaru): {newest['full_path']} ({newest.get('created_at')})")
            for dup in duplicates:
                size = dup.get("metadata", {}).get("size", 0) or 0
                total_freed_bytes += int(size)
                files_to_delete.append(dup["full_path"])
                print(f"  -> HAPUS (Lama)  : {dup['full_path']} ({int(size)/1024/1024:.2f} MB)")
                
    if not files_to_delete:
        print("\nTidak ada file duplikat fisik di bucket 'knowledge-files'.")
    else:
        print(f"\nMenghapus {len(files_to_delete)} file duplikat dari storage 'knowledge-files'...")
        print(f"Total storage yang dihemat: {total_freed_bytes / 1024 / 1024:.2f} MB")
        
        # Batch delete in chunks of 50
        for i in range(0, len(files_to_delete), 50):
            chunk = files_to_delete[i:i+50]
            supabase.storage.from_("knowledge-files").remove(chunk)
        print("BERHASIL membersihkan duplikat di 'knowledge-files'!")

def clean_data_uploads_bucket():
    print("\n=== 2. PEMBERSIHAN FILE RAW DI BUCKET 'data-uploads' ===")
    files = list_all_files_in_bucket("data-uploads", "")
    print(f"Total file di 'data-uploads': {len(files)}")
    
    if not files:
        print("Bucket 'data-uploads' sudah kosong.")
        return
        
    total_size = sum(int(f.get("metadata", {}).get("size", 0) or 0) for f in files)
    paths_to_delete = [f["full_path"] for f in files]
    
    print(f"Menghapus {len(paths_to_delete)} file dari 'data-uploads' ({total_size / 1024 / 1024:.2f} MB)...")
    for i in range(0, len(paths_to_delete), 50):
        chunk = paths_to_delete[i:i+50]
        supabase.storage.from_("data-uploads").remove(chunk)
    print("BERHASIL membersihkan seluruh file di 'data-uploads'!")

def clean_uploads_bucket():
    print("\n=== 3. PEMBERSIHAN FILE DI BUCKET 'uploads' ===")
    files = list_all_files_in_bucket("uploads", "")
    print(f"Total file di 'uploads': {len(files)}")
    if not files:
        print("Bucket 'uploads' sudah kosong.")
        return
    paths_to_delete = [f["full_path"] for f in files]
    for i in range(0, len(paths_to_delete), 50):
        chunk = paths_to_delete[i:i+50]
        supabase.storage.from_("uploads").remove(chunk)
    print("BERHASIL membersihkan bucket 'uploads'!")

if __name__ == "__main__":
    clean_knowledge_storage_duplicates()
    clean_data_uploads_bucket()
    clean_uploads_bucket()


