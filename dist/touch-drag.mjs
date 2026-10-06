// Pointer-based dragging for touch screens; native HTML dragging remains for mouse.
export function bindTouchTaskDrag({doc=document,win=window,resolveTask,onDrop,onPreview=()=>{}}){
 let session=null,ignoreClickUntil=0,frame=0;
 const now=()=>Date.now();
 function targetAt(x,y){return doc.elementFromPoint(x,y);}
 function clearPreview(){doc.querySelectorAll('.over').forEach(n=>n.classList.remove('over'));doc.querySelectorAll('.drop-mark').forEach(n=>n.remove());}
 function preview(){
  if(!session?.active)return;
  clearPreview();const target=targetAt(session.x,session.y),zone=target?.closest('[data-zone]'),row=target?.closest('.task-row');
  (zone||row)?.classList.add('over');onPreview(zone,session.y);
  session.ghost.style.left=session.x+12+'px';session.ghost.style.top=session.y+12+'px';
 }
 function scroll(){
  if(!session?.active)return;
  const hit=targetAt(session.x,session.y),pane=hit?.closest('.timeline-scroll');
  if(pane){const r=pane.getBoundingClientRect();const delta=session.y<r.top+48?-12:session.y>r.bottom-48?12:0;if(delta)pane.scrollTop+=delta;}
  const delta=session.y<64?-12:session.y>win.innerHeight-64?12:0;if(delta)win.scrollBy(0,delta);
  preview();frame=win.requestAnimationFrame(scroll);
 }
 function end(){
  if(!session)return;
  const old=session;session=null;win.cancelAnimationFrame(frame);old.ghost?.remove();old.source.classList.remove('touch-drag-source');clearPreview();
  try{old.source.releasePointerCapture(old.pointerId);}catch{}
  if(old.active)ignoreClickUntil=now()+500;
 }
 function down(e){
  if(e.pointerType==='mouse'||e.button!==0||session)return;
  const handle=e.target.closest('.handle'),chip=e.target.closest('.chip[data-task]'),source=handle||chip,task=source?.closest('[data-task]');
  if(!task)return;const title=resolveTask(task.dataset.task);if(title==null)return;
  session={pointerId:e.pointerId,id:task.dataset.task,source,title,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false};
  try{source.setPointerCapture(e.pointerId);}catch{}
 }
 function move(e){
  if(!session||e.pointerId!==session.pointerId)return;
  session.x=e.clientX;session.y=e.clientY;
  if(!session.active&&Math.hypot(e.clientX-session.startX,e.clientY-session.startY)<6)return;
  e.preventDefault();
  if(!session.active){session.active=true;session.source.classList.add('touch-drag-source');const ghost=doc.createElement('div');ghost.className='touch-drag-ghost';ghost.textContent=session.title;doc.body.append(ghost);session.ghost=ghost;frame=win.requestAnimationFrame(scroll);}
  preview();
 }
 function up(e){
  if(!session||e.pointerId!==session.pointerId)return;
  const old=session,target=targetAt(e.clientX,e.clientY),zone=target?.closest('[data-zone]'),row=target?.closest('.task-row');
  if(old.active)e.preventDefault();end();if(old.active)onDrop(old.id,zone,row,e.clientY);
 }
 function cancel(e){if(session?.pointerId===e.pointerId)end();}
 function click(e){if(now()<ignoreClickUntil){e.preventDefault();e.stopImmediatePropagation();}}
 function nativeDrag(e){if(session){e.preventDefault();e.stopImmediatePropagation();}}
 function context(e){if(session||e.target.closest('.handle,.chip[data-task]')&&now()<ignoreClickUntil){e.preventDefault();e.stopImmediatePropagation();}}
 doc.addEventListener('pointerdown',down);
 doc.addEventListener('pointermove',move,{passive:false});
 doc.addEventListener('pointerup',up);
 doc.addEventListener('pointercancel',cancel);
 doc.addEventListener('lostpointercapture',cancel);
 doc.addEventListener('click',click,true);
 doc.addEventListener('contextmenu',context,true);
 doc.addEventListener('dragstart',nativeDrag,true);
 return ()=>{end();doc.removeEventListener('pointerdown',down);doc.removeEventListener('pointermove',move);doc.removeEventListener('pointerup',up);doc.removeEventListener('pointercancel',cancel);doc.removeEventListener('lostpointercapture',cancel);doc.removeEventListener('click',click,true);doc.removeEventListener('contextmenu',context,true);doc.removeEventListener('dragstart',nativeDrag,true);};
}
