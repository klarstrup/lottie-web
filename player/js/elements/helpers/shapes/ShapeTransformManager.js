import Matrix from "../../../3rd_party/transformation-matrix";

function ShapeTransformManager() {
  this.sequences = {};
  this.sequenceList = [];
  this.transform_key_count = 0;
}

ShapeTransformManager.prototype = {
  addTransformSequence(transforms) {
    let key = "_";
    for (const transform of transforms) key += transform.transform.key + "_";

    let sequence = this.sequences[key];
    if (!sequence) {
      sequence = { transforms: [...transforms], finalTransform: new Matrix(), _mdf: false };
      this.sequences[key] = sequence;
      this.sequenceList.push(sequence);
    }
    return sequence;
  },
  processSequence(sequence, isFirstFrame) {
    let i = 0;
    const len = sequence.transforms.length;
    let _mdf = isFirstFrame;
    while (i < len && !isFirstFrame) {
      if (sequence.transforms[i].transform.mProps._mdf) {
        _mdf = true;
        break;
      }
      i += 1;
    }
    if (_mdf) {
      let props;
      sequence.finalTransform.reset();
      for (i = len - 1; i >= 0; i -= 1) {
        props = sequence.transforms[i].transform.mProps.v.props;
        sequence.finalTransform.transform(
          props[0],
          props[1],
          props[2],
          props[3],
          props[4],
          props[5],
          props[6],
          props[7],
          props[8],
          props[9],
          props[10],
          props[11],
          props[12],
          props[13],
          props[14],
          props[15],
        );
      }
    }
    sequence._mdf = _mdf;
  },
  processSequences(isFirstFrame) {
    for (const sequence of this.sequenceList) this.processSequence(sequence, isFirstFrame);
  },
  getNewKey() {
    this.transform_key_count += 1;
    return "_" + this.transform_key_count;
  },
};

export default ShapeTransformManager;
