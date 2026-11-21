// MODE EDIT BOLA (v11). Tombol "Edit Bola" di kiri bawah (di atas tombol dashboard). Saat aktif:
//  - bola berhenti berjalan, seret/tahan dimatikan, ketuk bola (atau ikon di menu) untuk memilihnya
//  - menu: slider rotasi X, Y, Z (-180°..180°) + tombol ±15°, Reset bola, Reset semua, Simpan pose, Selesai
// Logika putaran ada di walk.js (K.setEdit, K.editApi, edStep). Tombol baru muncul setelah cutscene portal selesai (K.camReady).
(function(){var K=window.KAIH,X=K.ctx,scene=X.scene,cv=X.canvas,PI=Math.PI,
 NAMES={treadmill:['Olahraga','🏃'],people:['Masyarakat','🧑‍🤝‍🧑'],angel:['Malaikat','😇'],clock:['Jam Weker','⏰'],bed:['Tidur','😴'],book:['Buku','📖'],food:['Makanan','🍔']},
 ORDER=['treadmill','people','angel','clock','bed','book','food'],AX=[['x','X','#ff8a8a'],['y','Y','#9be58a'],['z','Z','#8ab8ff']],
 on=false,shown=false,sel=null;
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
var btn=el('button','','<span>◆</span><span class="t">Edit Bola</span>');btn.id='edit-btn';btn.type='button';btn.className='off';document.body.appendChild(btn);
var panel=el('div');panel.id='edit-panel';document.body.appendChild(panel);
panel.innerHTML='<h3>EDIT BOLA</h3><div class="ed-chips"></div><div class="ed-name"></div><div class="ed-rows"></div>'+
 '<label class="ed-keep"><input type="checkbox" id="ed-keep"><span>Tetap miring setelah selesai</span></label><div class="ed-hint">Y mengubah arah bola secara permanen. Miring X/Z: setelah Selesai bola berguling lalu melompat berdiri lagi (kecuali dicentang).</div>'+
 '<div class="ed-act"><button type="button" id="ed-r1">Reset bola</button><button type="button" id="ed-r2">Reset semua</button><button type="button" class="pri" id="ed-ok">Selesai</button></div>';
var chips=panel.querySelector('.ed-chips'),nameEl=panel.querySelector('.ed-name'),rows=panel.querySelector('.ed-rows'),chipEls={},rowEls={};
ORDER.forEach(function(t){var c=el('button','ed-chip',NAMES[t][1]);c.type='button';c.title=NAMES[t][0];c.onclick=function(){var it=find(t);if(it)select(it)};chips.appendChild(c);chipEls[t]=c});
AX.forEach(function(a){var r=el('div','ed-row','<b style="color:'+a[2]+'">'+a[1]+'</b><button type="button" class="m">◀</button><input type="range" min="-180" max="180" step="1" value="0"><button type="button" class="p">▶</button><output>0°</output>');rows.appendChild(r);
  var inp=r.querySelector('input'),out=r.querySelector('output');rowEls[a[0]]={inp:inp,out:out};
  inp.oninput=function(){setAxis(a[0],+inp.value)};r.querySelector('.m').onclick=function(){setAxis(a[0],wrap(+inp.value-15))};r.querySelector('.p').onclick=function(){setAxis(a[0],wrap(+inp.value+15))}});
function wrap(d){while(d>180)d-=360;while(d<-180)d+=360;return d}
function items(){return X.phys.items}
function find(t){var l=items();for(var i=0;i<l.length;i++)if(l[i].type===t&&l[i].settled&&l[i].spawned)return l[i];return null}
function setAxis(a,deg){if(!sel)return;deg=wrap(deg);if(a==='y')K.editApi.setYaw(sel,deg);else K.editApi.get(sel)[a]=deg;rowEls[a].inp.value=deg;rowEls[a].out.textContent=deg+'°'}   // Y = arah tubuh bola (permanen)
function sync(){if(!sel)return;var e=K.editApi.get(sel);AX.forEach(function(a){var val=a[0]==='y'?K.editApi.yaw(sel):e[a[0]];rowEls[a[0]].inp.value=val;rowEls[a[0]].out.textContent=Math.round(val)+'°'});
  nameEl.textContent=NAMES[sel.type][1]+'  '+NAMES[sel.type][0];ORDER.forEach(function(t){chipEls[t].classList.toggle('sel',t===sel.type)})}
function select(it){sel=it;sync()}
function resetOne(){if(!sel)return;var e=K.editApi.get(sel);e.x=e.z=0;K.editApi.setYaw(sel,0);AX.forEach(function(a){rowEls[a[0]].inp.value=0;rowEls[a[0]].out.textContent='0°'});nameEl.textContent=NAMES[sel.type][1]+'  '+NAMES[sel.type][0]}
function resetAll(){items().forEach(function(o){if(!o.settled)return;var d=K.editApi.get(o);d.x=d.z=0;K.editApi.setYaw(o,0)});AX.forEach(function(a){rowEls[a[0]].inp.value=0;rowEls[a[0]].out.textContent='0°'})}
// cincin penanda bola terpilih
var ring=new THREE.Mesh(new THREE.RingGeometry(1.8,2.15,48),new THREE.MeshBasicMaterial({color:0xf6e6b4,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-PI/2;ring.visible=false;scene.add(ring);
function enter(){if(!K.setEdit(true))return;on=true;btn.classList.add('on');btn.querySelector('.t').textContent='Selesai Edit';panel.classList.add('on');
  panel.querySelector('#ed-keep').checked=!!K.editKeep;
  var first=sel&&sel.settled?sel:null;if(!first)for(var i=0;i<ORDER.length&&!first;i++)first=find(ORDER[i]);if(first)select(first)}
function exit(){K.editKeep=panel.querySelector('#ed-keep').checked;K.setEdit(false);on=false;btn.classList.remove('on');btn.querySelector('.t').textContent='Edit Bola';panel.classList.remove('on')}
btn.onclick=function(){if(btn.classList.contains('busy'))return;on?exit():enter()};
panel.querySelector('#ed-r1').onclick=resetOne;panel.querySelector('#ed-r2').onclick=resetAll;panel.querySelector('#ed-ok').onclick=exit;
panel.addEventListener('pointerdown',function(e){e.stopPropagation()});
if(cv)cv.addEventListener('pointerdown',function(e){if(!on||!K.drag||!K.drag.pickAt)return;var it=K.drag.pickAt(e.clientX,e.clientY);if(it&&NAMES[it.type])select(it)});
K.hooks.push(function(dt,t){
  if(!shown&&K.camReady){shown=true;btn.classList.remove('off')}
  btn.classList.toggle('busy',!!((K.eggBusy||K.sleepOn)&&!on));
  if(on){ORDER.forEach(function(ty){chipEls[ty].disabled=!find(ty)})}
  if(on&&sel&&sel.settled){var p=sel.body.position;ring.visible=true;ring.position.set(p.x,Math.max(0,K.H(p.x,p.z))+.12,p.z);ring.material.opacity=.55+.25*Math.sin(t*4);ring.scale.setScalar(1+.04*Math.sin(t*4))}
  else ring.visible=false});
})();
