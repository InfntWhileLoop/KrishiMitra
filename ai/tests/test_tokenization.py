from nlu.tokenization import build_slot_label_list, simple_whitespace_tokenize, align_tokens_and_slots


def test_build_slot_label_list():
    labels = build_slot_label_list(["crop", "location"])  # O, B-*, I-*
    assert labels[0] == "O"
    assert "B-crop" in labels and "I-location" in labels


def test_alignment_basic():
    text = "irrigate wheat in Jaipur"
    tokens, spans = simple_whitespace_tokenize(text)
    slot_spans = {
        "crop": [(text.find("wheat"), text.find("wheat") + len("wheat"))],
        "location": [(text.find("Jaipur"), text.find("Jaipur") + len("Jaipur"))],
    }
    labels = build_slot_label_list(["crop", "location"])
    ids = align_tokens_and_slots(tokens, spans, slot_spans, labels)
    id_to_label = {i: l for i, l in enumerate(labels)}
    tagged = [id_to_label[i] for i in ids]
    assert any(t.startswith("B-crop") for t in tagged)
    assert any(t.startswith("B-location") for t in tagged)

