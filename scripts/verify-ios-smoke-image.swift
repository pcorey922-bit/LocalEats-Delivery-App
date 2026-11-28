import Foundation
import Vision

// Offline, on-runner screenshot checks. Never print recognized text, account IDs,
// tokens or other image content; report only fixed boolean evidence.
func classify(_ text: String, audience: String) -> [String: Bool] {
    let normalized = text.uppercased().filter { $0.isLetter || $0.isNumber }
    let startupError = normalized.contains("APPSTARTUPDIDNOTFINISH") || normalized.contains("NATIVESTARTUPTIMEOUT")
    let signIn = normalized.contains("SIGNINORCREATEACCOUNTINBROWSER")
    let home = normalized.contains("GOODFOOD") && normalized.contains("BROWSERESTAURANTS")
    let guest = normalized.contains("CONTINUEASGUEST") || normalized.contains("USEAPRIVATEGUESTLINK") || normalized.contains("ORDERASGUEST")
    let expectedEntry = audience == "driver" ? signIn : (signIn || home)
    return ["uiVerified": expectedEntry && !startupError && !(audience == "driver" && guest), "startupErrorDetected": startupError, "expectedEntryDetected": expectedEntry, "unexpectedCustomerPaths": audience == "driver" && guest]
}
if CommandLine.arguments.count == 2 && CommandLine.arguments[1] == "--self-test" {
    let cases: [(String, String, Bool)] = [
        ("RoCoEats Driver Sign in or create account in browser", "driver", true),
        ("RoCoEats Sign in or create account in browser Continue as Guest", "customer", true),
        ("Sign in or create account in browser Continue as Guest", "driver", false),
        ("RoCoEats Good food Browse Restaurants & Menus Order as Guest", "customer", true),
        ("App startup did not finish NATIVE_STARTUP_TIMEOUT_RESTORING Reload app", "customer", false),
        ("", "customer", false)
    ]
    for (text, audience, expected) in cases {
        guard classify(text, audience: audience)["uiVerified"] == expected else { exit(1) }
    }
    print("PASS offline screenshot classification: valid signed-out entries, wrong audience, blank and startup-error screens.")
    exit(0)
}
guard CommandLine.arguments.count == 3 && ["customer", "driver"].contains(CommandLine.arguments[2]) else { exit(64) }
do {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["en-US"]
    request.usesLanguageCorrection = false
    try VNImageRequestHandler(url: URL(fileURLWithPath: CommandLine.arguments[1])).perform([request])
    let text = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: " ")
    let data = try JSONSerialization.data(withJSONObject: classify(text, audience: CommandLine.arguments[2]), options: [.sortedKeys])
    print(String(decoding: data, as: UTF8.self))
} catch {
    print("{\"uiVerified\":false,\"ocrUnavailable\":true}")
}
