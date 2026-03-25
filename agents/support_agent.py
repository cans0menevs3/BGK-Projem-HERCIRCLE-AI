import json

class HerCircleAgent:
    """
    HerCircle AI Destek Ajanı
    Gelecekte entegre edilecek olan Doğal Dil İşleme (NLP) tabanlı backend asistanı.
    Kullanıcı taleplerini analiz edip onlara en uygun mentorları ve destek kaynaklarını önerir.
    """
    def __init__(self):
        self.model_name = "gpt-4-turbo"
        self.system_prompt = "Sen HerCircle AI platformunun empati yeteneği yüksek, destekleyici asistanısın."
        
    def analyze_need(self, user_message):
        """Kullanıcının mesajından ihtiyacını (hukuki, psikolojik, eğitim) sınıflandırır."""
        # TODO: Gerçek bir LLM API entegrasyonu (örn: OpenAI API) buraya eklenecek.
        keywords = {
            "hukuk": ["dava", "hak", "avukat", "şiddet", "boşanma", "hukuk"],
            "psikoloji": ["üzgün", "depresyon", "terapi", "yalnız", "korku", "psikoloji"],
            "eğitim": ["kurs", "ders", "okul", "öğrenmek", "sertifika", "eğitim"]
        }
        
        user_message = user_message.lower()
        for category, words in keywords.items():
            if any(word in user_message for word in words):
                return category
                
        return "genel_destek"

    def generate_response(self, user_message, category):
        """Kullanıcıya özel yapay zeka tarafından oluşturulmuş destek yanıtı döner."""
        responses = {
            "hukuk": "Hukuki konularda yalnız değilsin. Platformumuzdaki kadın hakları alanında uzman gönüllü avukatlardan destek alabilirsin.",
            "psikoloji": "Zor bir dönemden geçtiğini duyuyorum. Seni dinlemeye ve profesyonel psikologlarımıza yönlendirmeye hazırım.",
            "eğitim": "Kendini geliştirmek istemen harika! Senin için uygun eğitim bursları ve mentorluk programlarımız var.",
            "genel_destek": "HerCircle AI olarak her zaman yanındayız. Sana nasıl yardımcı olabilirim?"
        }
        return responses.get(category, responses["genel_destek"])

    def process_request(self, user_message):
        """Ana otomasyon akışı"""
        print(f"[*] Ajan İşleniyor... Gelen Mesaj: '{user_message}'")
        category = self.analyze_need(user_message)
        print(f"[*] Ajan Analizi: Tespit Edilen Kategori -> {category.upper()}")
        response = self.generate_response(user_message, category)
        return {"category": category, "reply": response}

if __name__ == "__main__":
    # Ajanın örnek test kullanımı
    agent = HerCircleAgent()
    test_message = "Merhaba, kendimi çok yalnız ve üzgün hissediyorum. Psikolojik destek almak istiyorum."
    
    print("--- HerCircle AI Backend Otomasyon Testi ---")
    result = agent.process_request(test_message)
    print(f"\n[Ajan Yanıtı]: {result['reply']}")
    print("--------------------------------------------")
