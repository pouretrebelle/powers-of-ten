#include "Triangle.h"

// Constructor
//=====================================

Triangle::Triangle(vector <ofPoint> _pts, deque<ofImage> * _imgBuffer, int _maxBufferSize) {
  points = _pts;
  delay = ofRandom(_maxBufferSize);
  imgBuffer = _imgBuffer;

  // draw the triangle into the fbo
  mask.allocate(852, 480, GL_RGBA);
  mask.begin();
  ofDrawTriangle(points[0], points[1], points[2]);
  mask.end();
}

// Global Draw
//=====================================

void Triangle::draw() {
  if (imgBuffer->size() == 0) return;

  ofImage frame;

  int frameNum = delay;
  if (imgBuffer->size() <= frameNum) {
    frameNum = imgBuffer->size() - 1;
  }
  frame.clone(imgBuffer->at(frameNum));
  frame.getTexture().setAlphaMask(mask.getTexture());
  frame.draw(0, 0);
}
