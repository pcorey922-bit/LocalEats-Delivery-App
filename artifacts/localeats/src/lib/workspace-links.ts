export function workspaceLinks(role: string) {
  const common = [
    { title: "Find food", href: "/", detail: "Browse available restaurants and menus" },
    { title: "My orders", href: "/orders", detail: "Receipts, delivery tracking and support" },
    { title: "Notifications", href: "/notifications", detail: "Your saved operational updates" },
    { title: "Account access", href: "/account/access", detail: "Check your server-verified permissions" },
  ];
  if (role === "admin") return [
    { title: "Administrator controls", href: "/admin", detail: "Restaurants, accounts, approvals and finance overview" },
    { title: "Dispatch and order operations", href: "/operations", detail: "Assignments, exceptions, payments, refunds and pricing" },
    { title: "Drive with RoCoEats", href: "/driver", detail: "Driver duty, navigation and delivery workspace" },
    { title: "Earnings and onboarding", href: "/earnings", detail: "Test Connect setup and transaction history" }, ...common,
  ];
  if (role === "restaurant") return [
    { title: "Restaurant workspace", href: "/restaurant", detail: "Apply, manage menus and stock, and fulfill incoming orders" },
    { title: "Earnings and onboarding", href: "/earnings", detail: "Test Connect setup and transaction history" }, ...common,
  ];
  if (role === "driver") return [
    { title: "Driver workspace", href: "/driver", detail: "Application, duty, delivery offers and navigation" },
    { title: "Earnings and onboarding", href: "/earnings", detail: "Test Connect setup and transaction history" }, ...common,
  ];
  return [{ title: "My cart and addresses", href: "/cart", detail: "Customize an order and manage delivery addresses" }, ...common];
}
