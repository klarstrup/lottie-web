import Matrix from "../../3rd_party/transformation-matrix";
import { getTransformProperty } from "../../utils/TransformProperty";

function TransformElement() {}

TransformElement.prototype = {
  initTransform() {
    this.finalTransform = {
      mProp: this.data.ks ? getTransformProperty(this, this.data.ks, this) : { o: 0 },
      _matMdf: false,
      _opMdf: false,
      mat: new Matrix(),
    };
    if (this.data.ao) {
      this.finalTransform.mProp.autoOriented = true;
    }

    // TODO: check TYPE 11: Guided elements
    if (this.data.ty !== 11) {
      // this.createElements();
    }
  },
  renderTransform() {
    this.finalTransform._opMdf = this.finalTransform.mProp.o._mdf || this._isFirstFrame;
    this.finalTransform._matMdf = this.finalTransform.mProp._mdf || this._isFirstFrame;

    if (this.hierarchy) {
      const finalMat = this.finalTransform.mat;
      const len = this.hierarchy.length;
      // Checking if any of the transformation matrices in the hierarchy chain has changed.
      if (!this.finalTransform._matMdf) {
        let i = 0;
        while (i < len) {
          if (this.hierarchy[i].finalTransform.mProp._mdf) {
            this.finalTransform._matMdf = true;
            break;
          }
          i += 1;
        }
      }

      if (this.finalTransform._matMdf) {
        let mat = this.finalTransform.mProp.v.props;
        finalMat.cloneFromProps(mat);
        for (let i = 0; i < len; i += 1) {
          mat = this.hierarchy[i].finalTransform.mProp.v.props;
          finalMat.transform(
            mat[0],
            mat[1],
            mat[2],
            mat[3],
            mat[4],
            mat[5],
            mat[6],
            mat[7],
            mat[8],
            mat[9],
            mat[10],
            mat[11],
            mat[12],
            mat[13],
            mat[14],
            mat[15],
          );
        }
      }
    }
  },
  globalToLocal(pt) {
    const transforms = [];
    transforms.push(this.finalTransform);
    let flag = true;
    let comp = this.comp;
    while (flag) {
      if (comp.finalTransform) {
        if (comp.data.hasMask) transforms.splice(0, 0, comp.finalTransform);

        comp = comp.comp;
      } else {
        flag = false;
      }
    }

    for (const transform of transforms) {
      const ptNew = transform.mat.applyToPointArray(0, 0, 0);

      pt = [pt[0] - ptNew[0], pt[1] - ptNew[1], 0];
    }
    return pt;
  },
  mHelper: new Matrix(),
};

export default TransformElement;
