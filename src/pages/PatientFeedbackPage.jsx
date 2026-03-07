import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Card } from "../components/SharedUI";
import { PageWrap, SHead } from "../App";
import { Icons } from "../theme";

const T = {
  bg: "#F8F0E8", bgDeep: "#EAE0D6", surface: "#FCF9F6", surfaceHard: "#FDFBF9",
  border: "#E4D4C8", ink: "#2A1818", inkMid: "#5A4545", inkFaint: "#A08070",
  rose: "#D4706A", roseDeep: "#A84040", roseTint: "#FAF5F5",
  vital: "#5BAA8A", vitalPale: "#E8F4EE",
  amber: "#D4974A", amberPale: "#FDF8F2",
  white: "#FFFCF8",
};

export default function PatientFeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth0();
  
  const [doctorName, setDoctorName] = useState("");
  const [liked, setLiked] = useState("");
  const [improved, setImproved] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      patientName: user?.name || user?.email?.split("@")[0] || "Anonymous Patient",
      doctorName,
      liked,
      improved,
    };

    try {
      const res = await fetch("http://localhost:3001/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to submit feedback");
      
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageWrap title="Doctor Feedback" icon={<Icons.shield/>} subtitle="Thank you for your response">
        <div style={{ padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: T.vitalPale, color: T.vital, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 20 }}>
            ✓
          </div>
          <SHead>Feedback Submitted</SHead>
          <p style={{ fontFamily: "'Outfit',sans-serif", color: T.inkMid, marginTop: 10, marginBottom: 30, maxWidth: 400 }}>
            Your insights help us improve care quality across the Sanctii network. Thank you for your time.
          </p>
          <button className="btn-primary" onClick={() => navigate("/patient")}>
            Return to Dashboard
          </button>
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap title="Doctor Feedback" icon={<Icons.shield/>} subtitle="Help us improve your care">
      <Card style={{ maxWidth: 600, margin: "0 auto", padding: "32px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ color: T.roseDeep }}><Icons.stethoscope/></div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18, color: T.ink }}>Consultation Review</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: T.inkFaint, marginTop: 2 }}>Your feedback is shared securely with clinical administration.</div>
          </div>
        </div>

        {error && <div style={{ padding: 12, background: T.roseTint, color: T.roseDeep, borderRadius: 8, fontSize: 13, marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink }}>Attending Doctor Name</label>
            <input 
              type="text"
              required
              value={doctorName}
              onChange={e => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Sharma"
              style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bg, fontFamily: "'Outfit',sans-serif", fontSize: 14, color: T.ink, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink }}>What went well?</label>
            <textarea 
              required
              value={liked}
              onChange={e => setLiked(e.target.value)}
              placeholder="What did you like about the consultation?"
              rows={4}
              style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bg, fontFamily: "'Outfit',sans-serif", fontSize: 14, color: T.ink, outline: "none", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink }}>What could be improved?</label>
            <textarea 
              required
              value={improved}
              onChange={e => setImproved(e.target.value)}
              placeholder="Was there anything we could do better?"
              rows={4}
              style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.bg, fontFamily: "'Outfit',sans-serif", fontSize: 14, color: T.ink, outline: "none", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <button type="button" className="btn-ghost" onClick={() => navigate("/patient")} style={{ flex: 1, padding: "12px 0", justifyContent: "center" }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1, padding: "12px 0", justifyContent: "center" }}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </Card>
    </PageWrap>
  );
}
