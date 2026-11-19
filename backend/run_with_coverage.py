#!/usr/bin/env python3
"""
Coverage Runner for FastAPI - Start server with coverage tracking
Usage: python run_with_coverage.py
"""

import subprocess
import sys
import os
import signal
import time
import webbrowser
from pathlib import Path
import shutil

def cleanup_previous_coverage():
    """Clean up previous coverage files"""
    print("🧹 Cleaning up previous coverage data...")
    
    files_to_remove = [
        '.coverage',
        '.coverage.*',
        'coverage.xml',
        'htmlcov'
    ]
    
    for file_pattern in files_to_remove:
        for path in Path('.').glob(file_pattern):
            if path.is_file():
                path.unlink()
                print(f"   Removed: {path}")
            elif path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
                print(f"   Removed directory: {path}")
    
    # Clean any .coverage.* files
    for cov_file in Path('.').glob('.coverage.*'):
        cov_file.unlink()
        print(f"   Removed: {cov_file}")

def start_server_with_coverage():
    """Start the FastAPI server with coverage tracking"""
    print("🚀 Starting FastAPI server with coverage tracking...")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("\n" + "="*60)
    print("MANUAL TESTING INSTRUCTIONS:")
    print("="*60)
    print("1. Open your browser and navigate to http://localhost:8000")
    print("2. Test ALL features of your application:")
    print("   - Navigate through all pages")
    print("   - Click all buttons/links")
    print("   - Test all form submissions")
    print("   - Test all API endpoints (check /docs)")
    print("   - Test different user flows")
    print("3. When finished testing, come back here and press:")
    print("   CTRL + C to stop the server")
    print("="*60 + "\n")
    
    # Set environment variable for coverage
    os.environ['COVERAGE_PROCESS_START'] = str(Path('.coveragerc').absolute())
    
    # Build the command to start uvicorn
    cmd = [
        sys.executable, "-m", "coverage", "run",
        "--source=.", 
        "--data-file=.coverage.runtime",
        "-m", "uvicorn", 
        "app.main:app",  # Adjust this to your app location
        "--reload",
        "--host", "0.0.0.0", 
        "--port", "8000"
    ]
    
    print(f"Starting command: {' '.join(cmd[:6])} ...")
    
    # Start the server
    process = subprocess.Popen(cmd)
    
    # Wait a moment for server to start
    time.sleep(2)
    
    # Try to open browser automatically
    try:
        webbrowser.open('http://localhost:8000')
        time.sleep(1)
        webbrowser.open('http://localhost:8000/docs')
    except:
        print("Could not open browser automatically. Please open manually.")
    
    return process

def generate_coverage_reports():
    """Generate coverage reports after server stops"""
    print("\n" + "="*60)
    print("📊 GENERATING COVERAGE REPORTS")
    print("="*60)
    
    # Combine coverage data if parallel mode was used
    print("Combining coverage data...")
    combine_result = subprocess.run(
        [sys.executable, "-m", "coverage", "combine"],
        capture_output=True,
        text=True
    )
    
    if combine_result.stdout:
        print(combine_result.stdout)
    
    # Generate HTML report
    print("\nGenerating HTML report...")
    html_result = subprocess.run(
        [sys.executable, "-m", "coverage", "html", 
         "--directory=htmlcov", 
         "--title='FastAPI Runtime Coverage'"],
        capture_output=True,
        text=True
    )
    
    # Generate terminal report
    print("\nGenerating terminal report...")
    print("-" * 60)
    subprocess.run([
        sys.executable, "-m", "coverage", "report",
        "--show-missing",
        "--skip-covered"
    ])
    
    # Generate XML report (optional for CI/CD)
    print("\nGenerating XML report...")
    subprocess.run([
        sys.executable, "-m", "coverage", "xml",
        "-o", "coverage.xml"
    ])
    
    # Show summary
    print("\n" + "="*60)
    print("📋 COVERAGE SUMMARY")
    print("="*60)
    subprocess.run([
        sys.executable, "-m", "coverage", "report",
        "--format=total"
    ])
    
    # Open the HTML report
    html_path = Path('htmlcov/index.html')
    if html_path.exists():
        print(f"\n📈 HTML report generated at: {html_path.absolute()}")
        print("Opening report in browser...")
        webbrowser.open(f'file://{html_path.absolute()}')
    else:
        print("\n❌ HTML report not generated. Check for errors above.")

def find_uncovered_files():
    """Find files with no coverage"""
    print("\n" + "="*60)
    print("🔍 FILES WITH NO COVERAGE (Potential Dead Code)")
    print("="*60)
    
    result = subprocess.run(
        [sys.executable, "-m", "coverage", "report", "--format=total"],
        capture_output=True,
        text=True
    )
    
    # Parse output to find 0% coverage
    lines = result.stdout.split('\n')
    for line in lines:
        if '%' in line:
            parts = line.split()
            if len(parts) >= 4:
                try:
                    coverage_pct = float(parts[-1].replace('%', ''))
                    if coverage_pct == 0:
                        filename = ' '.join(parts[:-4])
                        if filename and not filename.startswith('---'):
                            print(f"❌ {filename}: 0% coverage")
                except ValueError:
                    continue

def main():
    """Main function to run the coverage process"""
    try:
        # Clean up previous coverage data
        cleanup_previous_coverage()
        
        # Start server with coverage
        server_process = start_server_with_coverage()
        
        # Wait for server to be stopped (Ctrl+C)
        try:
            server_process.wait()
        except KeyboardInterrupt:
            print("\n\n⏹️  Stopping server...")
            server_process.terminate()
            server_process.wait()
        
        # Generate reports
        generate_coverage_reports()
        
        # Find uncovered files
        find_uncovered_files()
        
        print("\n✅ Process completed!")
        print("\n💡 TIPS FOR ANALYZING RESULTS:")
        print("   1. Red lines in HTML report = never executed")
        print("   2. Files with 0% coverage = likely dead code")
        print("   3. Check if uncovered code is:")
        print("      - Error handlers (404, 500 pages)")
        print("      - Admin-only features")
        print("      - Legacy/disabled features")
        print("      - Actually dead code (safe to delete)")
        
    except Exception as e:
        print(f"\n❌ Error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()