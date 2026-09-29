import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraRelativeInput,clampPitch} from '../shared/controls.mjs';
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-12,`${actual} != ${expected}`);
test('forward and strafe follow the view at the four compass headings',()=>{
  for(const [heading,x,y] of [[0,0,1],[Math.PI/2,1,0],[Math.PI,0,-1],[-Math.PI/2,-1,0]]){
    const forward=cameraRelativeInput(0,1,heading),right=cameraRelativeInput(1,0,heading);
    close(forward.x,x);close(forward.y,y);close(right.x,y);close(right.y,-x);
  }
});
test('diagonal movement has the same speed in every view direction',()=>{
  for(let heading=-Math.PI;heading<Math.PI;heading+=.07){
    const diagonal=cameraRelativeInput(1,1,heading);close(Math.hypot(diagonal.x,diagonal.y),1);
    assert.ok(Math.abs(diagonal.x)<=1&&Math.abs(diagonal.y)<=1);
  }
  assert.deepEqual(cameraRelativeInput(0,0,1),{x:0,y:0});
});
test('looking up and down never flips the camera',()=>{
  close(clampPitch(0),0);close(clampPitch(.3),.3);
  assert.ok(clampPitch(100)<Math.PI/2);assert.ok(clampPitch(-100)>-Math.PI/2);
  close(clampPitch(-100),-clampPitch(100));
});
