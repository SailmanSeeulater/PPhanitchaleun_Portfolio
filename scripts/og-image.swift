// Takes the picture that shows when the site is shared in a message or on LinkedIn (public/og.jpg, 1200 by 630).
// It photographs the real page, so it needs the site running first (npm run dev), then:
//   npm run og
// The page is loaded as a returning visitor, so the picture is the plain desktop, not the first-visit intro or
// the Welcome note. macOS only: it uses WebKit, which comes with the system.
import AppKit
import WebKit

let args = CommandLine.arguments
let address = args.count > 1 ? args[1] : "http://localhost:5199/"
let out = URL(fileURLWithPath: args.count > 2 ? args[2] : "public/og.jpg")
let size = NSSize(width: 1200, height: 630)

final class Shooter: NSObject, WKNavigationDelegate {
  let web: WKWebView
  let window: NSWindow

  override init() {
    let config = WKWebViewConfiguration()
    config.websiteDataStore = .nonPersistent()
    // Before the page's own code runs: mark the intro, the Welcome note and the first-visit hint as already seen.
    let seen = "try{for(const k of ['stage-intro','stage-welcome','stage-nudge'])localStorage.setItem(k,'1');localStorage.setItem('stage-theme','white')}catch(e){}"
    config.userContentController.addUserScript(WKUserScript(source: seen, injectionTime: .atDocumentStart, forMainFrameOnly: true))
    web = WKWebView(frame: NSRect(origin: .zero, size: size), configuration: config)
    // A window far off the screen: WebKit only paints a view that is in one.
    window = NSWindow(contentRect: NSRect(x: -4000, y: -4000, width: size.width, height: size.height), styleMask: .borderless, backing: .buffered, defer: false)
    window.contentView = web
    window.orderBack(nil)
    super.init()
    web.navigationDelegate = self
    web.load(URLRequest(url: URL(string: address)!))
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    // Give the fonts, the pictures and the opening fade a few seconds to settle.
    DispatchQueue.main.asyncAfter(deadline: .now() + 5) { self.shoot() }
  }

  func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
    FileHandle.standardError.write("Couldn't open \(address). Is the site running (npm run dev)?\n".data(using: .utf8)!)
    exit(1)
  }

  func shoot() {
    let config = WKSnapshotConfiguration()
    config.snapshotWidth = NSNumber(value: Double(size.width))
    web.takeSnapshot(with: config) { image, error in
      guard let image else {
        FileHandle.standardError.write("No picture: \(error?.localizedDescription ?? "unknown error")\n".data(using: .utf8)!)
        exit(1)
      }
      // Drawn into a bitmap of exactly 1200 by 630 pixels, whatever the screen's own density.
      let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width), pixelsHigh: Int(size.height), bitsPerSample: 8, samplesPerPixel: 4,
                                 hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
      rep.size = size
      NSGraphicsContext.saveGraphicsState()
      NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
      NSGraphicsContext.current?.imageInterpolation = .high
      image.draw(in: NSRect(origin: .zero, size: size), from: .zero, operation: .copy, fraction: 1)
      NSGraphicsContext.restoreGraphicsState()
      try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.9])!.write(to: out)
      print("wrote \(out.path) (\(Int(size.width))x\(Int(size.height)))")
      exit(0)
    }
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let shooter = Shooter()
// Stop waiting after half a minute if the page never finishes loading.
DispatchQueue.main.asyncAfter(deadline: .now() + 30) {
  FileHandle.standardError.write("Gave up waiting for \(address).\n".data(using: .utf8)!)
  exit(1)
}
_ = shooter
app.run()
