from nlu.tokenization import build_slot_label_list


def decode_slots(slot_ids, labels):
    spans = []
    cur = None
    for i, sid in enumerate(slot_ids):
        lab = labels[sid]
        if lab == "O":
            if cur:
                spans.append(cur)
                cur = None
            continue
        prefix, name = lab.split("-", 1)
        if prefix == "B":
            if cur:
                spans.append(cur)
            cur = (name, [i])
        else:
            if cur and cur[0] == name:
                cur[1].append(i)
            else:
                cur = (name, [i])
    if cur:
        spans.append(cur)
    return spans


def test_decode_slots_runs():
    labels = build_slot_label_list(["crop", "location"])  # 1x O + 2x per slot
    # O B-crop I-crop O B-location
    seq = [0, labels.index("B-crop"), labels.index("I-crop"), 0, labels.index("B-location")]
    spans = decode_slots(seq, labels)
    assert ("crop", [1, 2]) in spans
    assert ("location", [4]) in spans

