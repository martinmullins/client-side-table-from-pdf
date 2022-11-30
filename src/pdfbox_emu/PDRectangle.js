export  class PDRectangle {
  constructor(points) {
    const [x,y,w,h] = points;
    this.x = x;
    this.y = y;
    this.xw = x + w;
    this.yh = y + h;
    this.w = w;
    this.h = h;
  }

  getLowerLeftX() {
    return this.x;
  }

  getLowerLeftY() {
    return this.y;
  }

  getUpperRightX() {
    return this.xw;
  }

  getUpperRightY() {
    return this.yh;
  }

  getWidth() {
    return this.w;
  }

  getHeight() {
    return this.h;
  }
}