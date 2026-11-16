import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  Info,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Home,
} from "lucide-react";
import { unsubscribeFromNewsletter } from "../../../api/user/newsletter";
import "./UnsubscribeConfirmation.css";

type UnsubscribeState =
  | "loading"
  | "success"
  | "alreadyUnsubscribed"
  | "invalidToken"
  | "error";

interface UnsubscribeResponse {
  success: boolean;
  message: string;
  alreadyUnsubscribed?: boolean;
}

const UnsubscribeConfirmation: React.FC = () => {
  const [state, setState] = useState<UnsubscribeState>(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    return token ? "loading" : "invalidToken";
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) return;

    unsubscribeFromNewsletter(token)
      .then((res: UnsubscribeResponse) => {
        if (res.alreadyUnsubscribed) {
          setState("alreadyUnsubscribed");
        } else {
          setState("success");
        }
      })
      .catch((err: Error) => {
        setErrorMessage(err.message || "Something went wrong.");
        setState("error");
      });
  }, []);

  const handleTryAgain = () => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("invalidToken");
      return;
    }
    setState("loading");
    unsubscribeFromNewsletter(token)
      .then((res: UnsubscribeResponse) => {
        if (res.alreadyUnsubscribed) {
          setState("alreadyUnsubscribed");
        } else {
          setState("success");
        }
      })
      .catch((err: Error) => {
        setErrorMessage(err.message || "Something went wrong.");
        setState("error");
      });
  };

  const getIcon = () => {
    switch (state) {
      case "success":
        return (
          <div className="uc-icon-wrapper success">
            <div className="uc-icon-bg">
              <CheckCircle size={32} className="uc-icon" />
            </div>
            <div className="uc-pulse-ring" />
          </div>
        );
      case "alreadyUnsubscribed":
        return (
          <div className="uc-icon-wrapper info">
            <Info size={32} className="uc-icon" />
          </div>
        );
      case "invalidToken":
        return (
          <div className="uc-icon-wrapper warning">
            <AlertTriangle size={32} className="uc-icon" />
          </div>
        );
      case "error":
        return (
          <div className="uc-icon-wrapper error">
            <AlertCircle size={32} className="uc-icon" />
          </div>
        );
      default:
        return (
          <div className="uc-spinner-wrapper">
            <div className="uc-spinner"></div>
          </div>
        );
    }
  };

  const getHeading = () => {
    switch (state) {
      case "success":
        return "Successfully Unsubscribed!";
      case "alreadyUnsubscribed":
        return "Already Unsubscribed";
      case "invalidToken":
        return "Invalid Unsubscribe Link";
      case "error":
        return "Something Went Wrong";
      default:
        return "Processing your unsubscribe request...";
    }
  };

  const getMessage = () => {
    switch (state) {
      case "success":
        return (
          <>
            You have been successfully unsubscribed from LocalNewz newsletter emails. You will no longer receive new article updates.
            <p className="uc-footer">
              Thank you for being a part of LocalNewz.
            </p>
          </>
        );
      case "alreadyUnsubscribed":
        return "This email address is already unsubscribed from LocalNewz newsletter emails.";
      case "invalidToken":
        return "The unsubscribe link is invalid or has expired. Please request a new one.";
      case "error":
        return errorMessage;
      default:
        return "Please wait while we process your request.";
    }
  };

  const getActionButtons = () => {
    if (state === "loading") return null;

    return (
      <div className="uc-actions">
        {state === "error" ? (
          <button
            className="uc-btn uc-btn-outline"
            onClick={handleTryAgain}
            type="button"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        ) : null}
        <Link to="/" className="uc-btn uc-btn-primary">
          <Home size={16} /> Back to Home
        </Link>
      </div>
    );
  };

  return (
    <div className="uc-page">
      <div className="uc-card">
        {getIcon()}
        <h1 className="uc-title">{getHeading()}</h1>
        <p className="uc-message">{getMessage()}</p>
        {getActionButtons()}
      </div>
    </div>
  );
};

export default UnsubscribeConfirmation;
