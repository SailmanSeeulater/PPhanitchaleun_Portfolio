// Draws public/resume.pdf as images (public/resume-1.png, -2, ...) for the Résumé app on the laptop screen.
// The live server forbids putting any page in a frame (X-Frame-Options: DENY), so the PDF can't be shown in an
// iframe there; a picture of each page shows everywhere, phones included. Run it after replacing resume.pdf:
//   npm run resume
// macOS only: it uses PDFKit, which comes with the system.
import AppKit
import PDFKit

let root = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : ".")
let pdf = root.appendingPathComponent("public/resume.pdf")
guard let doc = PDFDocument(url: pdf) else {
  FileHandle.standardError.write("Can't read \(pdf.path)\n".data(using: .utf8)!)
  exit(1)
}
// Three times the PDF's own size: sharp on a high-density screen even when the window is wide.
let scale: CGFloat = 3
for i in 0..<doc.pageCount {
  let page = doc.page(at: i)!
  let box = page.bounds(for: .mediaBox)
  let w = Int(box.width * scale), h = Int(box.height * scale)
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4,
                             hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  let ctx = NSGraphicsContext(bitmapImageRep: rep)!.cgContext
  ctx.setFillColor(.white)
  ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: ctx)
  let out = root.appendingPathComponent("public/resume-\(i + 1).png")
  try! rep.representation(using: .png, properties: [:])!.write(to: out)
  print("wrote \(out.lastPathComponent) (\(w)x\(h))")
}
print("\(doc.pageCount) page(s). If the count changed, update RESUME_PAGES in src/Stage.jsx.")
