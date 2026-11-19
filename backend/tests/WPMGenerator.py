#!/usr/bin/env python3
import subprocess
import os
import math

def generate_wpm_audio_simple():
    """Generate WPM audio files using macOS say command"""
    
    # Define text
    # text = "The quick brown fox jumps over the lazy dog. This sentence contains every letter in the English alphabet and serves as an excellent test for speech recognition systems. When evaluating words per minute, it's important to use diverse vocabulary and varied sentence structures. Different speaking rates can significantly affect transcription accuracy, especially with rapid speech or technical terminology. Proper testing requires multiple samples across various speeds to ensure reliable performance measurements."
    text ="Well, you know, the process of developing a new application feature is, um, actually quite complex. I mean, you start with the initial idea, right, and then you have to, like, draft the specifications and gather requirements. So, basically, you need to figure out what the users, you know, really need and how the feature should, um, work in practice. After that, it's time for the design phase, which can be, sort of, challenging because you're balancing functionality with, like, user experience. Then comes the coding part, which is, well, where you actually build the thing. You know, you write the code, test it, fix bugs, and, um, sometimes you have to go back and redo parts if they don't, like, work as expected. Finally, after all that work, you deploy the feature and, I mean, hope that everything goes smoothly. It's, you know, a cycle that requires patience and attention to detail."
    
    # Word count
    words = len(text.split())
    print(f"Text has {words} words")
    
    # WPM levels
    wpm_levels = [100, 150, 200]
    
    # Create output directory
    output_dir = "wpm_audio"
    os.makedirs(output_dir, exist_ok=True)
    
    print("\nGenerating audio files...")
    print("=" * 50)
    
    for wpm in wpm_levels:
        # Calculate target duration
        target_duration = (words / wpm) * 60  # in seconds
        
        # Generate filename
        filename = f"wpm_{wpm}.aiff"
        filepath = os.path.join(output_dir, filename)
        
        print(f"\n{wpm} WPM:")
        print(f"  Target duration: {target_duration:.1f} seconds")
        
        try:
            # Generate audio with say command
            # Note: say command doesn't have direct WPM control, 
            # so we'll adjust rate parameter
            base_rate = 175  # Base speaking rate
            
            # Rough estimation of rate adjustment
            # This is approximate - actual WPM may vary
            adjusted_rate = int(base_rate * (wpm / 150))
            
            cmd = [
                'say', 
                '-v', 'Alex',           # Voice
                '-r', str(adjusted_rate), # Rate
                '-o', filepath,         # Output file
                text                    # Text to speak
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Convert to MP3 if ffmpeg is available
            mp3_file = filepath.replace('.aiff', '.mp3')
            try:
                cmd_convert = [
                    'ffmpeg',
                    '-i', filepath,
                    '-y',  # Overwrite output
                    mp3_file
                ]
                subprocess.run(cmd_convert, check=True, capture_output=True)
                print(f"  Generated: {mp3_file}")
                
                # Remove AIFF file
                os.remove(filepath)
                
            except:
                print(f"  Generated: {filepath} (AIFF format)")
                print("  Install ffmpeg to convert to MP3: brew install ffmpeg")
                
        except subprocess.CalledProcessError as e:
            print(f"  Error: {e}")
        except FileNotFoundError:
            print("  Error: 'say' command not found (macOS only)")
            break
    
    print("\n" + "=" * 50)
    print("Done!")
    
    if os.path.exists(output_dir):
        files = os.listdir(output_dir)
        if files:
            print(f"\nGenerated {len(files)} files in '{output_dir}':")
            for f in files:
                print(f"  - {f}")
        else:
            print("\nNo files were generated.")

if __name__ == "__main__":
    generate_wpm_audio_simple()