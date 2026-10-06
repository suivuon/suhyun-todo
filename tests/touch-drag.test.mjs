import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindTouchTaskDrag} from '../dist/touch-drag.mjs';
function fixture(){
 const listeners=new Map(),frames=new Map(),classes=new Set();let point=null,scrolled=0,captured=null,ghosts=[],nextFrame=0;
 const source={classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},closest:s=>s==='[data-task]'?{dataset:{task:'task1'}}:null,setPointerCapture:id=>captured=id,releasePointerCapture:()=>captured=null};
 const handle={closest:s=>s==='.handle'?source:null};
 const doc={body:{append:g=>ghosts.push(g)},createElement:()=>({style:{},remove(){ghosts=ghosts.filter(g=>g!==this);}}),querySelectorAll:()=>[],elementFromPoint:()=>point,addEventListener:(t,f)=>listeners.set(t,f),removeEventListener:t=>listeners.delete(t)};
 const win={innerHeight:800,scrollBy:(x,y)=>scrolled+=y,requestAnimationFrame:f=>{frames.set(++nextFrame,f);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id)};
 const drops=[];const dispose=bindTouchTaskDrag({doc,win,resolveTask:()=> '과제',onDrop:(...args)=>drops.push(args)});
 const emit=(type,extra={})=>{const e={target:handle,pointerType:'touch',pointerId:1,button:0,clientX:30,clientY:100,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};listeners.get(type)?.(e);return e;};
 return {emit,drops,dispose,win,get captured(){return captured;},get ghosts(){return ghosts;},get scrolled(){return scrolled;},frames,setPoint:p=>point=p};
}
test('touch handle places task on timeline and suppresses accidental edit click',()=>{
 const f=fixture(),zone={classList:{add(){}},dataset:{zone:'timeline'},getBoundingClientRect:()=>({top:200})};
 f.emit('pointerdown');assert.equal(f.captured,1);
 f.setPoint({closest:s=>s==='[data-zone]'?zone:null});f.emit('pointermove',{clientX:180,clientY:815});assert.equal(f.ghosts.length,1);
 f.emit('pointerup',{clientX:180,clientY:815});assert.equal(f.drops.length,1);assert.equal(f.drops[0][1],zone);assert.equal(f.captured,null);assert.equal(f.ghosts.length,0);
 assert.equal(f.emit('click').stopped,true);f.dispose();
});
test('tap preserves normal click and cancellation creates no schedule',()=>{
 const f=fixture();f.emit('pointerdown');f.emit('pointerup');assert.equal(f.drops.length,0);assert.equal(f.emit('click').stopped,undefined);
 f.emit('pointerdown');f.emit('pointermove',{clientY:140});f.emit('pointercancel');assert.equal(f.drops.length,0);assert.equal(f.ghosts.length,0);assert.equal(f.frames.size,0);f.dispose();
});
test('edge dragging scrolls page and timeline; another finger cannot drop the task',()=>{
 const f=fixture(),pane={scrollTop:0,getBoundingClientRect:()=>({top:250,bottom:790})};f.setPoint({closest:s=>s==='.timeline-scroll'?pane:null});f.emit('pointerdown');f.emit('pointermove',{clientY:780});
 [...f.frames.values()][0]();assert.equal(pane.scrollTop,12);assert.equal(f.scrolled,12);
 f.emit('pointerup',{pointerId:2});assert.equal(f.drops.length,0);assert.equal(f.ghosts.length,1);
 f.emit('pointercancel');f.dispose();
});
test('mouse keeps native drag and unrelated controls do not start a touch drag',()=>{
 const f=fixture();f.emit('pointerdown',{pointerType:'mouse'});assert.equal(f.captured,null);f.emit('pointerdown',{target:{closest:()=>null}});assert.equal(f.captured,null);f.dispose();
});
