# =============================================================================
# NLU Decoding Tests - Unit Tests for Slot Extraction and Processing
# =============================================================================
# This module contains comprehensive unit tests for the NLU decoding
# functionality, including:
#
# Test Coverage:
# 1. BIO Decoding: Tests conversion of BIO tags back to slot spans
# 2. Gazetteer Processing: Tests domain vocabulary normalization
# 3. Edge Runtime: Tests complete inference pipeline
# 4. Language Detection: Tests multilingual text processing
# 5. Error Handling: Tests robustness with invalid inputs
#
# Test Scenarios:
# - Mixed language queries (English + Hindi)
# - Slot extraction accuracy and confidence
# - Performance benchmarking and latency
# - Complex slot combinations and edge cases
# - Gazetteer normalization and fallbacks
#
# Usage: Run with pytest to ensure decoding quality and runtime reliability.
# These tests validate the production inference pipeline.
# =============================================================================

import pytest
from unittest.mock import Mock, patch
from packaging.runtime_edge import EdgeRuntime, GazetteerProcessor, BIODecoder
from pathlib import Path


class TestGazetteerProcessor:
    """Test suite for gazetteer processing functionality."""
    
    def test_load_gazetteer(self, tmp_path):
        """Test loading gazetteer files."""
        # Create test gazetteer files
        crops_file = tmp_path / "crops.txt"
        crops_file.write_text("wheat\npaddy\ncotton\nrice")
        
        stages_file = tmp_path / "stages.txt"
        stages_file.write_text("nursery\ntillering\nflowering")
        
        processor = GazetteerProcessor(tmp_path)
        
        assert "wheat" in processor.crops
        assert "paddy" in processor.crops
        assert "nursery" in processor.stages
        assert "flowering" in processor.stages
    
    def test_normalize_crop(self, tmp_path):
        """Test crop name normalization."""
        crops_file = tmp_path / "crops.txt"
        crops_file.write_text("wheat\npaddy\ncotton")
        
        processor = GazetteerProcessor(tmp_path)
        
        # Test exact matches
        assert processor.normalize_crop("wheat") == "wheat"
        assert processor.normalize_crop("paddy") == "paddy"
        
        # Test case insensitive
        assert processor.normalize_crop("WHEAT") == "wheat"
        assert processor.normalize_crop("Paddy") == "paddy"
        
        # Test partial matches
        assert processor.normalize_crop("wheat field") == "wheat"
        
        # Test unknown crops
        assert processor.normalize_crop("unknown") == "unknown"
    
    def test_normalize_stage(self, tmp_path):
        """Test growth stage normalization."""
        stages_file = tmp_path / "stages.txt"
        stages_file.write_text("nursery\ntillering\nflowering")
        
        processor = GazetteerProcessor(tmp_path)
        
        assert processor.normalize_stage("nursery") == "nursery"
        assert processor.normalize_stage("TILLERING") == "tillering"
        assert processor.normalize_stage("flowering stage") == "flowering"
        assert processor.normalize_stage("unknown") == "unknown"

class TestBIODecoder:
    """Test suite for BIO tag decoding."""
    
    def test_decode_slots_basic(self):
        """Test basic slot decoding."""
        label_maps = {
            "intent_to_id": {"irrigation_when": 0},
            "slot_to_id": {"O": 0, "B-crop": 1, "I-crop": 2, "B-location": 3}
        }
        
        decoder = BIODecoder(label_maps)
        
        # Test single slot
        slot_preds = [0, 1, 0, 3]  # O, B-crop, O, B-location
        tokens = ["irrigate", "wheat", "in", "Jaipur"]
        
        slots = decoder.decode_slots(slot_preds, tokens)
        
        assert "crop" in slots
        assert "location" in slots
        assert slots["crop"][0]["value"] == "wheat"
        assert slots["location"][0]["value"] == "Jaipur"
    
    def test_decode_slots_continuation(self):
        """Test I- tag continuation."""
        label_maps = {
            "intent_to_id": {"irrigation_when": 0},
            "slot_to_id": {"O": 0, "B-crop": 1, "I-crop": 2}
        }
        
        decoder = BIODecoder(label_maps)
        
        # Test B-I sequence
        slot_preds = [0, 1, 2]  # O, B-crop, I-crop
        tokens = ["irrigate", "wheat", "field"]
        
        slots = decoder.decode_slots(slot_preds, tokens)
        
        assert "crop" in slots
        assert slots["crop"][0]["value"] == "wheat field"
    
    def test_decode_slots_multiple(self):
        """Test multiple slots of same type."""
        label_maps = {
            "intent_to_id": {"irrigation_when": 0},
            "slot_to_id": {"O": 0, "B-crop": 1, "I-crop": 2}
        }
        
        decoder = BIODecoder(label_maps)
        
        # Test multiple crop mentions
        slot_preds = [0, 1, 0, 1]  # O, B-crop, O, B-crop
        tokens = ["irrigate", "wheat", "and", "cotton"]
        
        slots = decoder.decode_slots(slot_preds, tokens)
        
        assert "crop" in slots
        assert len(slots["crop"]) == 2
        assert slots["crop"][0]["value"] == "wheat"
        assert slots["crop"][1]["value"] == "cotton"

class TestEdgeRuntime:
    """Test suite for edge runtime functionality."""
    
    def test_language_detection(self, tmp_path):
        """Test automatic language detection."""
        # Mock model directory
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Test English detection
        assert runtime.detect_language("When should I irrigate wheat?") == "en"
        
        # Test Hindi detection
        assert runtime.detect_language("गेहूं को पानी कब देना चाहिए") == "hi"
        
        # Test mixed language
        assert runtime.detect_language("irrigate wheat गेहूं") == "hi"
    
    def test_tokenization(self, tmp_path):
        """Test text tokenization."""
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Test basic tokenization
        tokens = runtime.tokenize("When should I irrigate wheat?")
        assert tokens == ["When", "should", "I", "irrigate", "wheat?"]
        
        # Test Hindi tokenization
        tokens = runtime.tokenize("गेहूं को पानी देना")
        assert len(tokens) > 0
    
    def test_stub_inference(self, tmp_path):
        """Test stub inference functionality."""
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Test irrigation intent
        intent, slots = runtime._stub_inference(["irrigate", "wheat"])
        assert intent == "irrigation_when"
        
        # Test seed recommendation intent
        intent, slots = runtime._stub_inference(["recommend", "seeds"])
        assert intent == "seed_recommendation"
        
        # Test stress risk intent
        intent, slots = runtime._stub_inference(["check", "stress"])
        assert intent == "stress_risk"
    
    def test_date_parsing(self, tmp_path):
        """Test date parsing functionality."""
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Test relative dates
        assert runtime._parse_date("kal") == "tomorrow"
        assert runtime._parse_date("tomorrow") == "tomorrow"
        assert runtime._parse_date("parson") == "day_after_tomorrow"
        
        # Test unknown dates
        assert runtime._parse_date("unknown") == "unknown"
    
    def test_complete_pipeline(self, tmp_path):
        """Test complete inference pipeline."""
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Test complete prediction
        result = runtime.predict("When should I irrigate my wheat in Jaipur?")
        
        assert "intent" in result
        assert "slots" in result
        assert "language" in result
        assert "inference_time_ms" in result
        assert result["language"] == "en"

class TestPerformance:
    """Test suite for performance and benchmarking."""
    
    def test_inference_latency(self, tmp_path):
        """Test inference latency performance."""
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Test single inference latency
        result = runtime.predict("irrigate wheat")
        
        # Should complete within reasonable time
        assert result["inference_time_ms"] < 1000  # Less than 1 second
        
        # Test multiple inferences for consistency
        times = []
        for _ in range(5):
            result = runtime.predict("irrigate wheat")
            times.append(result["inference_time_ms"])
        
        # Should be reasonably consistent
        avg_time = sum(times) / len(times)
        assert avg_time < 100  # Average under 100ms
    
    def test_memory_usage(self, tmp_path):
        """Test memory usage patterns."""
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Test that multiple predictions don't cause memory leaks
        for _ in range(10):
            runtime.predict("irrigate wheat")
        
        # Runtime should still be functional
        result = runtime.predict("irrigate wheat")
        assert "intent" in result

class TestErrorHandling:
    """Test suite for error handling and edge cases."""
    
    def test_invalid_model_dir(self):
        """Test handling of invalid model directory."""
        with pytest.raises(Exception):
            EdgeRuntime(Path("/nonexistent/path"))
    
    def test_empty_text(self, tmp_path):
        """Test handling of empty text input."""
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Should handle empty text gracefully
        result = runtime.predict("")
        assert "intent" in result
    
    def test_very_long_text(self, tmp_path):
        """Test handling of very long text input."""
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Create very long text
        long_text = "irrigate wheat " * 1000
        
        # Should handle long text without crashing
        result = runtime.predict(long_text)
        assert "intent" in result
    
    def test_special_characters(self, tmp_path):
        """Test handling of special characters."""
        model_dir = tmp_path / "model"
        model_dir.mkdir()
        
        runtime = EdgeRuntime(model_dir)
        
        # Test various special characters
        special_texts = [
            "irrigate wheat!",
            "irrigate wheat?",
            "irrigate wheat...",
            "irrigate wheat (urgent)",
            "irrigate wheat & cotton"
        ]
        
        for text in special_texts:
            result = runtime.predict(text)
            assert "intent" in result

