import uuid
import re
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.chat import ChatSession, ChatMessage
from app.models.pnr import PNR
from app.services.eta_service import eta_service
from app.services.booking_service import booking_service
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse


class ChatbotService:
    def __init__(self):
        self.multilingual_greetings = {
            "en": "Hello! I am your RailPulse AI Assistant. How can I help you today? You can ask me for live train ETA, check PNR status, search trains, or request on-board services.",
            "hi": "नमस्ते! मैं आपका RailPulse AI सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ? आप मुझसे लाइव ट्रेन ETA, PNR स्थिति, ट्रेन खोज या कोच सेवाओं के बारे में पूछ सकते हैं।",
            "ta": "வணக்கம்! நான் உங்கள் RailPulse AI உதவியாளர். உங்களுக்கு எவ்வாறு உதவ முடியும்? நேரடி ரயில் நிலை, PNR நிலை, அல்லது பெட்டி சேவைகளை என்னிடம் கேட்கலாம்.",
            "te": "నమస్కారం! నేను మీ RailPulse AI అసిస్టెంట్‌ని. నేను మీకు ఎలా సహాయపడగలను? ప్రత్యక్ష రైలు సమాచారం, PNR స్థితి లేదా సేవలను అడగవచ్చు.",
            "bn": "নমস্কার! আমি আপনার RailPulse AI সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি? আপনি লাইভ ট্রেনের অবস্থা, PNR স্থিতি বা ট্রেন পরিষেবা সম্পর্কে জিজ্ঞাসা করতে পারেন।"
        }

    def process_message(self, req: ChatMessageRequest, user_id: Optional[int], db: Session) -> ChatMessageResponse:
        session_id = req.session_id or str(uuid.uuid4())
        user_text = req.text.strip()
        lang = req.language or "en"

        # Check or create session
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            session = ChatSession(id=session_id, user_id=user_id, language=lang)
            db.add(session)
            db.commit()

        # Save user message
        user_msg = ChatMessage(session_id=session_id, role="user", content=user_text)
        db.add(user_msg)
        db.commit()

        # Intent parsing & function-calling execution
        reply_text = ""
        action_type = None
        action_data = None
        quick_replies = ["Live ETA of 12951", "Check PNR Status", "Search Delhi to Mumbai Trains", "Emergency SOS"]

        lower_text = user_text.lower()

        # Intent 1: Check PNR
        pnr_match = re.search(r'\b\d{10}\b', user_text)
        if "pnr" in lower_text or pnr_match:
            pnr_no = pnr_match.group(0) if pnr_match else None
            if pnr_no:
                pnr = booking_service.get_pnr(pnr_no, db=db)
                if pnr:
                    reply_text = f"✅ PNR {pnr_no} is **CONFIRMED** for {pnr.passenger_name}.\nTrain: {pnr.train_no} - {pnr.train_name}\nCoach: **{pnr.coach}**, Berth: **{pnr.berth}** ({pnr.berth_type})\nDate: {pnr.journey_date}"
                    action_type = "pnr_card"
                    action_data = {
                        "pnr_id": pnr.id,
                        "passenger_name": pnr.passenger_name,
                        "train_no": pnr.train_no,
                        "train_name": pnr.train_name,
                        "coach": pnr.coach,
                        "berth": pnr.berth,
                        "berth_type": pnr.berth_type,
                        "status": pnr.status,
                        "journey_date": pnr.journey_date
                    }
                    quick_replies = [f"Track Train {pnr.train_no}", "Request Cleaning", "Seat Swap Request"]
                else:
                    reply_text = f"🔍 PNR **{pnr_no}** was not found in our live database. Please double check the 10-digit number."
            else:
                reply_text = "Please enter your 10-digit PNR number to check live status and seat allocation."

        # Intent 2: Live ETA / Where is train
        elif any(k in lower_text for k in ["eta", "where is", "running status", "delay", "time", "12951", "22436", "12002", "12626"]):
            train_match = re.search(r'\b(12951|22436|12002|12626|\d{5})\b', user_text)
            train_no = train_match.group(0) if train_match else "12951"
            
            eta_info = eta_service.compute_live_train_eta(train_no, db=db)
            if eta_info:
                reply_text = (
                    f"🚆 **{eta_info['train_name']} ({eta_info['train_no']})**\n"
                    f"• Status: **{'On Time' if eta_info['overall_delay_minutes'] <= 5 else f'{eta_info['overall_delay_minutes']} mins late'}**\n"
                    f"• Current Speed: **{int(eta_info['current_speed_kmh'])} km/h**\n"
                    f"• Location: {eta_info['current_station_or_section']}\n"
                    f"• Confidence Range: **{eta_info['confidence_range_str']}**\n"
                    f"• Explainability: _{eta_info['explainability_text']}_"
                )
                action_type = "eta_card"
                action_data = eta_info
                quick_replies = ["Check Station Board", "Book Ticket", "Food on Track", "File Complaint"]
            else:
                reply_text = f"Live telemetry is currently calibrating for Train {train_no}. Please check again in 1 minute."

        # Intent 3: Search Trains
        elif any(k in lower_text for k in ["search", "trains between", "find train", "delhi to", "mumbai to", "bhopal"]):
            trains = booking_service.search_trains(from_station="NDLS", to_station="MMCT")
            reply_text = f"Found **{len(trains)} premium trains** between New Delhi and Mumbai Central. Tap a train below to view fare & seat availability."
            action_type = "booking_card"
            action_data = {"trains": trains[:3]}
            quick_replies = ["Book 12951 Rajdhani", "Book 22436 Vande Bharat", "Check Fares"]

        # Intent 4: Emergency SOS / Safety
        elif any(k in lower_text for k in ["sos", "emergency", "help", "danger", "police", "rpf", "medical"]):
            reply_text = "🚨 **EMERGENCY ASSISTANCE ACTIVATED**\nIf you are in immediate danger or need medical help, tap the **Emergency SOS** button below. RPF and the on-board train captain will be alerted immediately with your location."
            action_type = "sos_card"
            action_data = {"emergency_number": "139", "rpf_control": "182"}
            quick_replies = ["Trigger 1-Tap SOS", "Call 139 Railway Helpline", "Report Medical Emergency"]

        # Intent 5: Cleaning & Housekeeping
        elif any(k in lower_text for k in ["clean", "cleaning", "dirty", "toilet", "washroom", "linen", "dustbin"]):
            reply_text = "🧹 **Coach Cleaning Assistance (OBHS)**\nYou can raise an instant cleaning request for your coach and berth. An attendant will arrive within 10-15 minutes."
            action_type = "cleaning_card"
            action_data = {"types": ["Toilet", "Coach Floor", "Berth sanitization", "Trash clearance"]}
            quick_replies = ["Clean Toilet", "Clean Coach Floor", "Fresh Linen Request"]

        # Fallback / Greeting
        else:
            greeting = self.multilingual_greetings.get(lang, self.multilingual_greetings["en"])
            reply_text = f"{greeting}\n\nWhat would you like to do?"

        # Save assistant message
        asst_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=reply_text,
            action_type=action_type,
            action_data=str(action_data) if action_data else None
        )
        db.add(asst_msg)
        db.commit()

        return ChatMessageResponse(
            session_id=session_id,
            reply_text=reply_text,
            language=lang,
            action_type=action_type,
            action_data=action_data,
            suggested_quick_replies=quick_replies
        )


chatbot_service = ChatbotService()
