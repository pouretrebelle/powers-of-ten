#pragma once
#include "ofMain.h"

class Triangle {

public:

  Triangle(vector <ofPoint> _pts, deque<ofImage> * _imgBuffer, int _maxBufferSize);
  void draw();

  deque<ofImage> * imgBuffer;
  ofFbo mask;
  int delay;
  vector <ofPoint> points;

private:

};
