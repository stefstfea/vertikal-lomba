// Pengganti ringan React Three Fiber: cukup untuk menjalankan models.js apa adanya.
// models.js memakai K.useRef, N.jsx/jsxs, Ai (useFrame) dan ke (Mesh helper).
(function(){var K=window.KAIH=window.KAIH||{},cbs=[];
var GEO={box:'BoxGeometry',circle:'CircleGeometry',cone:'ConeGeometry',cylinder:'CylinderGeometry',icosahedron:'IcosahedronGeometry',sphere:'SphereGeometry',torus:'TorusGeometry',octahedron:'OctahedronGeometry'};
var col=function(c){return new THREE.Color(c).convertSRGBToLinear()};
var R=K.r3f={K:{useRef:function(v){return{current:v}},useMemo:function(factory){return factory()}},
  N:{jsx:function(t,p,k){return{type:t,props:p||{},key:k}}},
  Ai:function(f){cbs.push(f)},
  ke:function(p){var r=Object.assign({},p),c=r.color,e=r.emissive,ei=r.emissiveIntensity,ch=r.children;
    delete r.color;delete r.emissive;delete r.emissiveIntensity;delete r.children;r.castShadow=true;r.receiveShadow=true;
    r.children=[ch,{type:'meshStandardMaterial',props:{color:c||'#ffffff',emissive:e||'#000000',emissiveIntensity:ei||0,flatShading:true,roughness:.9}}];
    return{type:'mesh',props:r}}};
R.N.jsxs=R.N.jsx;
function apply(o,p){for(var k in p){var v=p[k];
  if(k==='children'||k==='args'||k==='key')continue;
  if(k==='ref'){typeof v==='function'?v(o):(v&&(v.current=o));continue}
  if(k.length>2&&k.indexOf('on')===0&&typeof v==='function'){(o.userData.kh=o.userData.kh||{})[k]=v;continue}
  if(k==='position'||k==='rotation')o[k].set.apply(o[k],v);
  else if(k==='scale')typeof v==='number'?o.scale.setScalar(v):o.scale.set.apply(o.scale,v);
  else if(k.indexOf('rotation-')===0)o.rotation[k.slice(9)]=v;
  else if(k==='castShadow'||k==='receiveShadow'||k==='visible')o[k]=v}}
function build(n,parent){
  if(n==null||typeof n==='boolean'||typeof n==='string'||typeof n==='number')return;
  if(Array.isArray(n)){n.forEach(function(c){build(c,parent)});return}
  var t=n.type,p=n.props,m;
  if(typeof t==='function'){build(t(p),parent);return}
  if((m=t.match(/^(\w+)Geometry$/))){parent.geometry=new(Function.prototype.bind.apply(THREE[GEO[m[1]]],[null].concat(p.args||[])))();return}
  if((m=t.match(/^(\w+)Material$/))){var q={};for(var k in p){if(k==='children'||k==='ref'||k==='key')continue;q[k]=(k==='color'||k==='emissive')?col(p[k]):p[k]}
    parent.material=new THREE['M'+t.slice(1)](q);return}
  var o=t==='group'?new THREE.Group():t==='mesh'?new THREE.Mesh():t==='pointLight'?new THREE.PointLight(col(p.color||'#fff'),p.intensity==null?1:p.intensity,p.distance||0,2):null;
  if(!o)return;apply(o,p);parent.add(o);build(p.children,o)}
R.mount=function(C,props){var g=new THREE.Group();build({type:C,props:props||{}},g);return g};
R.tick=function(t,dt){var s={clock:{elapsedTime:t},delta:dt};cbs.forEach(function(f){try{f(s,dt)}catch(e){if(!R._reported){R._reported=true;console.warn('KAIH model animation callback skipped:',e)}}})};
K.models=window.KAIH_createModels({K:R.K,N:R.N,Ai:R.Ai,ke:R.ke});
})();
