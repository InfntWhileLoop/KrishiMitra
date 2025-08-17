# =============================================================================
# NLU Tokenization Tests - Unit Tests for Text Processing
# =============================================================================
# This module contains comprehensive unit tests for the NLU tokenization
# functionality, including:
#
# Test Coverage:
# 1. BIO Tag Alignment: Tests character span to token alignment
# 2. Mixed Language Support: English + Indic language processing
# 3. Edge Cases: Empty text, single tokens, boundary conditions
# 4. Validation: BIO tag sequence validation and error detection
# 5. Integration: End-to-end tokenization pipeline testing
#
# Test Scenarios:
# - Basic tokenization with whitespace splitting
# - Slot span alignment for different slot types
# - Multilingual text processing (English, Hindi)
# - BIO tag validation and error handling
# - Token position calculation accuracy
#
# Usage: Run with pytest to ensure tokenization quality and reliability.
# These tests are critical for maintaining NLU system accuracy.
# =============================================================================

import pytest
from nlu.tokenization import align_tokens_and_slots, validate_bio_tags

class TestTokenization:
    """Test suite for NLU tokenization functionality."""
    
    def test_basic_tokenization(self):
        """Test basic whitespace tokenization."""
        text = "When should I irrigate my wheat?"
        slots = {}
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        expected_tokens = ["When", "should", "I", "irrigate", "my", "wheat?"]
        expected_tags = ["O", "O", "O", "O", "O", "O"]
        
        assert tokens == expected_tokens
        assert bio_tags == expected_tags
    
    def test_crop_slot_alignment(self):
        """Test crop slot alignment with character spans."""
        text = "irrigate wheat in Jaipur"
        slots = {
            "crop": [{"start": 9, "end": 14, "value": "wheat"}]
        }
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        # Verify wheat is tagged as B-crop
        assert "B-crop" in bio_tags
        wheat_index = tokens.index("wheat")
        assert bio_tags[wheat_index] == "B-crop"
    
    def test_location_slot_alignment(self):
        """Test location slot alignment."""
        text = "irrigate wheat in Jaipur"
        slots = {
            "location": [{"start": 18, "end": 24, "value": "Jaipur"}]
        }
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        # Verify Jaipur is tagged as B-location
        assert "B-location" in bio_tags
        jaipur_index = tokens.index("Jaipur")
        assert bio_tags[jaipur_index] == "B-location"
    
    def test_multiple_slots(self):
        """Test multiple slot types in same text."""
        text = "irrigate wheat in Jaipur"
        slots = {
            "crop": [{"start": 9, "end": 14, "value": "wheat"}],
            "location": [{"start": 18, "end": 24, "value": "Jaipur"}]
        }
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        # Verify both slots are properly tagged
        wheat_index = tokens.index("wheat")
        jaipur_index = tokens.index("Jaipur")
        
        assert bio_tags[wheat_index] == "B-crop"
        assert bio_tags[jaipur_index] == "B-location"
    
    def test_hindi_text(self):
        """Test tokenization with Hindi text."""
        text = "गेहूं को पानी कब देना चाहिए"
        slots = {}
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        # Should tokenize Hindi text (though whitespace splitting may not be ideal)
        assert len(tokens) > 0
        assert all(tag == "O" for tag in bio_tags)
    
    def test_empty_text(self):
        """Test handling of empty text."""
        text = ""
        slots = {}
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        assert tokens == []
        assert bio_tags == []
    
    def test_single_token(self):
        """Test single token text."""
        text = "wheat"
        slots = {
            "crop": [{"start": 0, "end": 5, "value": "wheat"}]
        }
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        assert tokens == ["wheat"]
        assert bio_tags == ["B-crop"]

class TestBIOTagValidation:
    """Test suite for BIO tag validation."""
    
    def test_valid_bio_sequence(self):
        """Test valid BIO tag sequences."""
        tokens = ["irrigate", "wheat", "in", "Jaipur"]
        bio_tags = ["O", "B-crop", "O", "B-location"]
        
        assert validate_bio_tags(tokens, bio_tags) == True
    
    def test_invalid_i_tag_start(self):
        """Test invalid I- tag at sequence start."""
        tokens = ["irrigate", "wheat"]
        bio_tags = ["I-crop", "B-crop"]  # I- tag cannot start sequence
        
        assert validate_bio_tags(tokens, bio_tags) == False
    
    def test_invalid_i_tag_sequence(self):
        """Test invalid I- tag without preceding B- tag."""
        tokens = ["irrigate", "wheat", "field"]
        bio_tags = ["O", "B-crop", "I-location"]  # I-location without B-location
        
        assert validate_bio_tags(tokens, bio_tags) == False
    
    def test_mismatched_lengths(self):
        """Test tokens and tags with different lengths."""
        tokens = ["irrigate", "wheat"]
        bio_tags = ["O", "B-crop", "O"]  # More tags than tokens
        
        assert validate_bio_tags(tokens, bio_tags) == False
    
    def test_valid_i_tag_continuation(self):
        """Test valid I- tag continuation."""
        tokens = ["irrigate", "wheat", "field"]
        bio_tags = ["O", "B-crop", "I-crop"]  # Valid continuation
        
        assert validate_bio_tags(tokens, bio_tags) == True

class TestEdgeCases:
    """Test suite for edge cases and error conditions."""
    
    def test_overlapping_spans(self):
        """Test handling of overlapping slot spans."""
        text = "wheat field"
        slots = {
            "crop": [{"start": 0, "end": 5, "value": "wheat"}],
            "location": [{"start": 0, "end": 10, "value": "wheat field"}]  # Overlaps with crop
        }
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        # Should handle overlapping spans gracefully
        assert len(tokens) > 0
        assert len(bio_tags) == len(tokens)
    
    def test_span_out_of_bounds(self):
        """Test handling of spans outside text boundaries."""
        text = "wheat"
        slots = {
            "crop": [{"start": 10, "end": 15, "value": "invalid"}]  # Outside text bounds
        }
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        # Should handle out-of-bounds spans gracefully
        assert all(tag == "O" for tag in bio_tags)
    
    def test_mixed_language_spans(self):
        """Test slot spans in mixed language text."""
        text = "irrigate wheat गेहूं field"
        slots = {
            "crop": [{"start": 9, "end": 14, "value": "wheat"}],
            "location": [{"start": 20, "end": 25, "value": "field"}]
        }
        
        tokens, bio_tags = align_tokens_and_slots(text, slots)
        
        # Should handle mixed language text
        assert len(tokens) > 0
        assert len(bio_tags) == len(tokens)

