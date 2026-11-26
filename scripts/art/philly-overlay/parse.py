import xml.etree.ElementTree as ET, glob, json
nodes={};ways={};rels={}
for f in glob.glob('tiles/*.osm'):
  for ev,el in ET.iterparse(f):
    if el.tag=='node': nodes[el.get('id')]=(float(el.get('lat')),float(el.get('lon'))); el.clear()
    elif el.tag=='way':
      t={c.get('k'):c.get('v') for c in el if c.tag=='tag'}
      ways[el.get('id')]=( [c.get('ref') for c in el if c.tag=='nd'], t); el.clear()
    elif el.tag=='relation':
      t={c.get('k'):c.get('v') for c in el if c.tag=='tag'}
      rels[el.get('id')]=([(c.get('type'),c.get('ref'),c.get('role')) for c in el if c.tag=='member'],t); el.clear()
print(len(nodes),len(ways),len(rels))
def kind(t):
  if t.get('natural')=='water' or t.get('waterway')=='riverbank' or t.get('water'): return 'water'
  if t.get('leisure') in ('park','garden','nature_reserve') or t.get('landuse') in ('grass','cemetery','recreation_ground','village_green') : return 'park'
  return None
out=[]
def pts(ids): return [nodes[i] for i in ids if i in nodes]
for wid,(nd,t) in ways.items():
  k=kind(t)
  if k and len(nd)>3 and nd[0]==nd[-1]: out.append({'k':k,'name':t.get('name',''),'rings':[pts(nd)],'id':'w'+wid})
  if 'building' in t and t.get('name'): out.append({'k':'bldg','name':t['name'],'rings':[pts(nd)],'id':'w'+wid,'tags':t})
for rid,(mem,t) in rels.items():
  if t.get('type')!='multipolygon': continue
  k=kind(t) or ('bldg' if 'building' in t and t.get('name') else None)
  if not k: continue
  # assemble outer rings by chaining ways
  segs=[ways[r][0] for (ty,r,role) in mem if ty=='way' and r in ways and role in ('outer','')]
  inn=[ways[r][0] for (ty,r,role) in mem if ty=='way' and r in ways and role=='inner']
  def chain(segs):
    segs=[list(s) for s in segs]; rings=[]
    while segs:
      cur=segs.pop(0)
      changed=True
      while cur[0]!=cur[-1] and changed:
        changed=False
        for i,s in enumerate(segs):
          if s[0]==cur[-1]: cur+=s[1:]; segs.pop(i); changed=True; break
          if s[-1]==cur[-1]: cur+=s[::-1][1:]; segs.pop(i); changed=True; break
      rings.append(cur)
    return rings
  rings=[pts(r) for r in chain(segs)]; holes=[pts(r) for r in chain(inn)]
  out.append({'k':k,'name':t.get('name',''),'rings':rings,'holes':holes,'id':'r'+rid})
import collections; print(collections.Counter(o['k'] for o in out))
json.dump(out,open('features.json','w'))
for o in out:
  if o['k']=='bldg': print(o['name'])
