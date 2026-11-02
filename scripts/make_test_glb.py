"""Write a tiny test model (a coloured pyramid tower, 1 unit = 1 m, pivot at ground centre) as GLB.
Use it to check that an AssetSlot loads assets/models/<slot id>.glb with no code change.
Usage: python3 scripts/make_test_glb.py tests/fixtures/test_model.glb"""
import json, struct, sys

def tower():
    # square base 6x6 at y=0, apex at y=9
    v = [(-3, 0, -3), (3, 0, -3), (3, 0, 3), (-3, 0, 3), (0, 9, 0)]
    idx = [0, 2, 1, 0, 3, 2, 0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]
    return v, idx

v, idx = tower()
pos = b''.join(struct.pack('<3f', *p) for p in v)
ind = b''.join(struct.pack('<H', i) for i in idx)
ind += b'\x00' * ((4 - len(ind) % 4) % 4)
binbuf = pos + ind
gltf = {
    "asset": {"version": "2.0", "generator": "bloomlunas make_test_glb"},
    "scene": 0, "scenes": [{"nodes": [0]}],
    "nodes": [{"name": "test_model", "mesh": 0}],
    "meshes": [{"primitives": [{"attributes": {"POSITION": 0}, "indices": 1, "material": 0}]}],
    "materials": [{"pbrMetallicRoughness": {"baseColorFactor": [0.48, 0.44, 0.84, 1], "metallicFactor": 0, "roughnessFactor": 0.8}}],
    "buffers": [{"byteLength": len(binbuf)}],
    "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": len(pos), "target": 34962},
                    {"buffer": 0, "byteOffset": len(pos), "byteLength": len(idx) * 2, "target": 34963}],
    "accessors": [{"bufferView": 0, "componentType": 5126, "count": len(v), "type": "VEC3", "min": [-3, 0, -3], "max": [3, 9, 3]},
                  {"bufferView": 1, "componentType": 5123, "count": len(idx), "type": "SCALAR"}],
}
js = json.dumps(gltf).encode()
js += b' ' * ((4 - len(js) % 4) % 4)
out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binbuf))
out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binbuf), 0x004E4942) + binbuf
open(sys.argv[1], 'wb').write(out)
print('wrote', sys.argv[1], len(out), 'bytes')
