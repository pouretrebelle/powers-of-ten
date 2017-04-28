#include "ofApp.h"

//--------------------------------------------------------------
void ofApp::setup(){
  videoPlayer.loadMovie("480p.mp4");
  videoPlayer.play();

  maxBufferSize = 300;
  frameNum = 0;

  // this controls whether each frame is written to a file
  // which I manually compile into a video
  saveFrames = false;

  // add points for the four corners
  triangulation.addPoint(ofPoint(0, 0));
  triangulation.addPoint(ofPoint(ofGetWidth(), 0));
  triangulation.addPoint(ofPoint(0, ofGetHeight()));
  triangulation.addPoint(ofPoint(ofGetWidth(), ofGetHeight()));

  for (int i = 0; i < 40; i++) {
    // add random points in the triangulation object of ofxDelaunay
    triangulation.addPoint(ofPoint(ofRandomWidth(), ofRandomHeight()));
  }
  triangulation.triangulate(); // calculate the triangulation!

  for (int g = 0; g < triangulation.getNumTriangles(); g++) {
    // make a Triangle object out of each triangle
    vector <ofPoint> pts = getTriangle(g);
    Triangle triangle(pts, &imgBuffer, maxBufferSize);
    triangles.push_back(triangle);
  }
}

//--------------------------------------------------------------
void ofApp::update() {
  // iterate current frame
  frameNum++;

  // cout << videoPlayer.getCurrentFrame() << endl;

  videoPlayer.setPaused(true);
  if (frameNum < videoPlayer.getTotalNumFrames()) videoPlayer.setFrame(frameNum);
  videoPlayer.update();

  // add the current frame to the front of the buffer
  ofImage img;
  img.allocate(852, 480, OF_IMAGE_COLOR);
  img.setFromPixels(videoPlayer.getPixels());
  imgBuffer.push_front(img);

  // remove the last buffer image if it's overflowing
  if (imgBuffer.size() >= maxBufferSize) imgBuffer.pop_back();
}

//--------------------------------------------------------------
void ofApp::draw() {
  ofBackground(ofColor::black);
  ofSetColor(ofColor::white);

  // draw the current frame to the background to fix any black antialiasing problems
  videoPlayer.draw(0, 0);
  for (int i = 0; i < triangles.size(); i++) {
    triangles[i].draw();
  }

  if (saveFrames) {
    ofImage image;
    image.grabScreen(0, 0, ofGetWidth(), ofGetHeight());

    // create a 4 digit number string
    std::stringstream s1;
    s1 << std::setfill('0') << std::setw(4) << frameNum;
    std::string frameNumFormat = s1.str();

    // save the frame
    std::stringstream ss;
    ss << "frame-" << frameNumFormat << ".jpg";
    std::string s = ss.str();
    image.save(s, OF_IMAGE_QUALITY_BEST);
  }
}

//--------------------------------------------------------------
// custom function that takes an index and returns the coordinates of the triangle we refer to
vector <ofPoint> ofApp::getTriangle(int i) {
  int pA = triangulation.triangleMesh.getIndex(i * 3);
  int pB = triangulation.triangleMesh.getIndex(i * 3 + 1);
  int pC = triangulation.triangleMesh.getIndex(i * 3 + 2);

  ofPoint pointA = triangulation.triangleMesh.getVertex(pA);
  ofPoint pointB = triangulation.triangleMesh.getVertex(pB);
  ofPoint pointC = triangulation.triangleMesh.getVertex(pC);

  vector <ofPoint> points;
  points.push_back(pointA);
  points.push_back(pointB);
  points.push_back(pointC);
  return points;
}
