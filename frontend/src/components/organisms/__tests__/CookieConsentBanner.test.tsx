/// <reference types="jest" />

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CookieConsentBanner from "../CookieConsentBanner";
import { applyAnalyticsConsent } from "../../../observability/matomo";

jest.mock("../../../observability/matomo", () => ({
  applyAnalyticsConsent: jest.fn(),
}));

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const renderBanner = () => render(
    <BrowserRouter>
      <CookieConsentBanner />
    </BrowserRouter>,
  );

  it("s’affiche lorsqu’aucun choix n’a encore été enregistré", () => {
    renderBanner();
    expect(screen.getByRole("region", { name: "Votre confidentialité compte" })).toBeTruthy();
    expect(screen.getByText("Votre confidentialité compte")).toBeTruthy();
  });

  it("refuse les cookies optionnels sans activer Matomo", () => {
    renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Tout refuser" }));

    const preferences = JSON.parse(localStorage.getItem("cookiePreferences") || "{}");
    expect(preferences).toEqual(expect.objectContaining({
      essential: true,
      functional: false,
      analytics: false,
    }));
    expect(applyAnalyticsConsent).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("active Matomo après une acceptation explicite", () => {
    renderBanner();
    fireEvent.click(screen.getByRole("button", { name: "Tout accepter" }));
    expect(applyAnalyticsConsent).toHaveBeenCalledWith(true);
  });

  it("ne s’affiche plus lorsqu’un consentement valide existe", () => {
    localStorage.setItem("cookiePreferences", JSON.stringify({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    }));
    renderBanner();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
