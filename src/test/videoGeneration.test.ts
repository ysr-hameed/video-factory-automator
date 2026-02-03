import { describe, it, expect } from "vitest";
import { TextToSpeechService } from "../services/textToSpeech";
import { FrameGeneratorService } from "../services/frameGenerator";
import { VideoGenerationService } from "../services/videoGeneration";
import type { Section } from "../types/video";

describe("Video Generation Services", () => {
  describe("TextToSpeechService", () => {
    it("should create TTS service instance", () => {
      const ttsService = new TextToSpeechService();
      expect(ttsService).toBeDefined();
      expect(ttsService.isAvailable).toBeDefined();
    });

    it("should check if TTS is available", () => {
      const ttsService = new TextToSpeechService();
      const isAvailable = ttsService.isAvailable();
      expect(typeof isAvailable).toBe("boolean");
    });

    it("should estimate duration correctly", () => {
      const ttsService = new TextToSpeechService();
      const text = "This is a test sentence with ten words.";
      const duration = ttsService.estimateDuration(text, 1.0);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(60); // Should be less than a minute
    });

    it("should get available voices", () => {
      const ttsService = new TextToSpeechService();
      const voices = ttsService.getVoices();
      expect(Array.isArray(voices)).toBe(true);
    });
  });

  describe("FrameGeneratorService", () => {
    // Skip these tests in headless environment without canvas support
    it.skip("should create frame generator instance", () => {
      const generator = new FrameGeneratorService({
        width: 1920,
        height: 1080,
        fps: 30,
      });
      expect(generator).toBeDefined();
    });

    it.skip("should generate frames for sections", async () => {
      const generator = new FrameGeneratorService({
        width: 320, // Smaller for faster testing
        height: 180,
        fps: 10,
      });

      const testSections: Section[] = [
        {
          id: "1",
          type: "hook",
          title: "Test",
          content: "Test content",
          duration: 1, // 1 second for fast test
          order: 1,
        },
      ];

      const frames = await generator.generateFrames(testSections);
      expect(frames.length).toBeGreaterThan(0);
      expect(frames.length).toBe(10); // 1 second * 10 fps
      expect(frames[0].canvas).toBeDefined();
      expect(frames[0].timestamp).toBe(0);
      expect(frames[0].sectionId).toBe("1");
    });
  });

  describe("VideoGenerationService", () => {
    it("should create video generation service instance", () => {
      const service = new VideoGenerationService({
        width: 1920,
        height: 1080,
        fps: 30,
      });
      expect(service).toBeDefined();
    });

    it("should estimate generation time", () => {
      const service = new VideoGenerationService();
      const testSections: Section[] = [
        {
          id: "1",
          type: "hook",
          title: "Test",
          content: "Test content for estimation",
          duration: 30,
          order: 1,
        },
      ];

      const estimatedTime = service.estimateGenerationTime(testSections);
      expect(estimatedTime).toBeGreaterThan(0);
      expect(typeof estimatedTime).toBe("number");
    });

    it("should have cancel method", () => {
      const service = new VideoGenerationService();
      expect(service.cancel).toBeDefined();
      expect(typeof service.cancel).toBe("function");
    });
  });
});
