#pragma once

#include "ofMain.h"
#include "ofxDelaunay.h"
#include "Triangle.h"

class ofApp : public ofBaseApp{

	public:
		void setup();
		void update();
		void draw();

    ofVideoPlayer videoPlayer;
    deque<ofImage> imgBuffer;
    int maxBufferSize;
    int frameNum;

    bool saveFrames;

    vector <ofPoint> getTriangle(int i);
    vector <Triangle> triangles;
    ofxDelaunay triangulation;

};
