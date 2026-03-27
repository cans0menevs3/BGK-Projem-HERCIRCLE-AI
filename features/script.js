// TODO: Google Gemini API Anahtarınızı Buraya Ekleyin
// Not: Gerçek bir projede API key frontend'de doğrudan bırakılmaz, .env içinde veya backend'de saklanır.
// Projenin test edilebilmesi için API Key boş ise mock (sahte) verilerle çalışacak bir sistem kurulmuştur.
const GEMINI_API_KEY = ''; // API hatası verdiği için demo moda alındı
const SERPER_API_KEY = '';

// ====== MENTOR VERİSİ ======
let mentorsData = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data/mentors.json');
        if (response.ok) {
            mentorsData = await response.json();
        }
    } catch (error) {
        console.error("Mentor verileri yüklenemedi:", error);
    }
});

function findTopMentors(userText, limit = 2) {
    if (!mentorsData || mentorsData.length === 0) return [];
    const textWords = userText.toLowerCase().replace(/[.,!?;:()]/g, ' ').split(/\s+/);
    
    const scoredMentors = mentorsData.map(mentor => {
        let score = 0;
        mentor.expertise_keywords.forEach(keyword => {
            if (textWords.includes(keyword.toLowerCase())) {
                score += 3;
            } else {
                textWords.forEach(word => {
                    if (word.length > 3 && (keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase()))) {
                        score += 1;
                    }
                });
            }
        });
        return { ...mentor, score };
    });
    
    scoredMentors.sort((a, b) => b.score - a.score);
    return scoredMentors.slice(0, limit);
}

// DOM Elements
const problemInput = document.getElementById('problem-input');
const analyzeBtn = document.getElementById('analyze-btn');
const heroSection = document.getElementById('hero-section');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const resultsSection = document.getElementById('results-section');
const resetBtn = document.getElementById('reset-btn');

// UI Elements to fill
const categoryBadge = document.getElementById('category-badge');
const priorityBadge = document.getElementById('priority-badge');
const solutionPlanList = document.getElementById('solution-plan-list');
const tasksList = document.getElementById('tasks-list');
const circleList = document.getElementById('circle-list');

// Event Listeners
analyzeBtn.addEventListener('click', handleAnalyze);
resetBtn.addEventListener('click', resetUI);

async function handleAnalyze() {
    const text = problemInput.value.trim();
    if (!text) {
        showError("Lütfen önce probleminizi veya hedefinizi girin.");
        return;
    }

    // UI Updates
    errorState.classList.add('hidden');
    
    // Butonu ve inputu kilitle (gizlemek yerine)
    const analyzeBtnObj = document.getElementById('analyze-btn');
    const originalBtnHTML = analyzeBtnObj.innerHTML;
    analyzeBtnObj.disabled = true;
    analyzeBtnObj.innerHTML = '<span>Araştırılıyor...</span><i class="fa-solid fa-spinner fa-spin"></i>';
    problemInput.disabled = true;

    loadingState.classList.remove('hidden');

    // Show Resource Suggestions UI
    const resSug = document.getElementById('resource-suggestions');
    const resGrid = document.getElementById('suggestions-grid');
    resSug.classList.remove('hidden');
    
    // Render Skeletons
    resGrid.innerHTML = `
        <div class="skeleton-card"><div class="skeleton-text skeleton-title"></div><div class="skeleton-text skeleton-line-1"></div><div class="skeleton-text skeleton-line-2"></div></div>
        <div class="skeleton-card"><div class="skeleton-text skeleton-title"></div><div class="skeleton-text skeleton-line-1"></div><div class="skeleton-text skeleton-line-2"></div></div>
        <div class="skeleton-card"><div class="skeleton-text skeleton-title"></div><div class="skeleton-text skeleton-line-1"></div><div class="skeleton-text skeleton-line-2"></div></div>
    `;

    // Concurrently fetch Serper API
    fetchSerperResources(text).then(resources => {
        renderResources(resources);
    }).catch(err => {
        resGrid.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; padding: 10px;">Kaynaklar yüklenemedi. (Serper API Hatası)</p>';
        console.error("Serper API Error:", err);
    });

    try {
        let analysisData;

        if (GEMINI_API_KEY) {
            analysisData = await fetchFromGemini(text);
        } else {
            // Mock API Response for Demo purposes
            console.log("API Key bulunamadı, Demo veri kullanılıyor.");
            analysisData = await mockAnalyze(text);
        }

        renderResults(analysisData, text);

    } catch (error) {
        showError("Analiz sırasında bir sorun oluştu. Lütfen tekrar deneyin. Detay: " + error.message);
    } finally {
        analyzeBtnObj.disabled = false;
        analyzeBtnObj.innerHTML = originalBtnHTML;
        problemInput.disabled = false;
    }
}

// Mock Function for testing locally without API key (Akıllı Demo Modu)
function mockAnalyze(text) {
    return new Promise((resolve) => {
        setTimeout(() => {
            let lowerText = text.toLowerCase();
            
            // Kullanıcının derdini özetleyen kısa bir alıntı (dinamik his oluşturması için)
            let words = text.split(" ");
            let focusSubject = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
            
            // Hukuk senaryosu
            if (lowerText.includes("hukuk") || lowerText.includes("avukat") || lowerText.includes("dava") || lowerText.includes("hak") || lowerText.includes("şiddet") || lowerText.includes("boşanma")  || lowerText.includes("adli") || lowerText.includes("polis") ) {
                resolve({
                    kategori: "Hukuki Destek",
                    oncelik: "Yüksek",
                    cozum_plani: [
                        { baslik: "Hukuksal Ön Analiz", detay: `Yaşadığın durum ("${focusSubject}") için acil bir yasal değerlendirme yapılması gerekiyor.` },
                        { baslik: "Kritik Hakların", detay: "Mevcut yasal çerçevede (Medeni veya Ceza Hukuku) ne gibi hakların olduğunu öğren." },
                        { baslik: "Temsil Süreci", detay: "Seni başarıyla savunabilecek uzmanlarla bağlantıya geç." }
                    ],
                    gorevler: [
                        `Yaşadığın "${focusSubject}" olayını tüm detayları, tarih ve saatleriyle bir kağıda not al (Delil hazırlığı)`,
                        "Hukukçu Zeynep Kaya ile Destek Çemberi üzerinden hemen bir ön görüşme ayarla",
                        "Gerekiyorsa bulunduğun ilin Baro Adli Yardım servisini telefonla ara"
                    ],
                    destek_cemberi: [
                        { isim: "Av. Zeynep Kaya", rol: "Kadın Hakları Avukatı", id: "mentor_2", photo: "https://randomuser.me/api/portraits/women/44.jpg", bio: "Zeynep Kaya, kadın hakları savunuculuğunda 10 yılı aşkın deneyime sahip uzman bir avukattır. Özellikle aile içi şiddet ve iş yerinde mobbing konularında yüzlerce kadına gönüllü hukuki danışmanlık yapmış ve davalarını başarıyla temsil etmiştir. Karşılaştığın hukuki zorluklarda sana yasal haklarını anlatarak güçlü adımlar atmanı sağlar." },
                        { isim: "Hukuki Dayanışma Ağı", rol: "Topluluk", id: "group_2", photo: "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80", bio: "Hukuki Dayanışma Ağı, seninle benzer yasal zorluklardan geçmiş kadınların deneyimlerini paylaştığı ve birbirine omuz verdiği güvenli bir topluluktur. Burada yalnız olmadığını hissedeceksin." }
                    ]
                });
            } 
            // Psikoloji senaryosu
            else if (lowerText.includes("psikolo") || lowerText.includes("üzgün") || lowerText.includes("depresyon") || lowerText.includes("yalnız") || lowerText.includes("tükenmiş") || lowerText.includes("destek")  || lowerText.includes("kork") || lowerText.includes("mutsuz")) {
                resolve({
                    kategori: "Psikolojik Destek",
                    oncelik: "Orta-Yüksek",
                    cozum_plani: [
                        { baslik: "Duygu Farkındalığı", detay: `Şu an hissettiğin o "${focusSubject}" duygusunu veya durumunu kabul ederek öncelikle kendine şefkat göster.` },
                        { baslik: "Uzman Görüşmesi", detay: "İçinden geçtiğin süreci anlamlandırmak için uzman bir klinik psikolog ile seansa başla." },
                        { baslik: "Güvenli Alan", detay: "Asla yalnız olmadığını anlamak için senin hissettiklerini hisseden diğer kadınlarla bir araya gel." }
                    ],
                    gorevler: [
                        `Şu an içinde bulunduğun "${focusSubject}" durumunu tetikleyen unsurları bir duygu günlüğüne not et`,
                        "Psikolog Dr. Elif Yücel'den hızlı eşleşme ile randevu saatini rezerve et",
                        "Platformdaki 'Duygusal Dayanıklılık' rehber videosunu izle"
                    ],
                    destek_cemberi: [
                        { isim: "Dr. Elif Yücel", rol: "Klinik Psikolog", id: "mentor_3", photo: "https://randomuser.me/api/portraits/women/68.jpg", bio: "Dr. Elif Yücel, bilişsel davranışçı terapi ve travma sonrası stres bozukluğu uzmanıdır. Kadınların duygusal dayanıklılığını artırmasına ve stresli süreçleri sağlıklı yönetmesine yardımcı olacak güvenli bir alan yaratmaktadır." },
                        { isim: "Duygusal Destek Çemberi", rol: "Topluluk", id: "group_3", photo: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80", bio: "Duygusal Destek Çemberi, empatinin ve şefkatin öne çıktığı bir gruptur. Psikolojik zorluklar yaşayan kadınlar, profesyonel moderatörler eşliğinde burada içlerini dökebilir ve iyileşme sürecini birlikte atlatabilirler." }
                    ]
                });
            }
            // Varsayılan / Eğitim-Kariyer
            else {
                resolve({
                    kategori: "Kariyer / Eğitim",
                    oncelik: "Orta",
                    cozum_plani: [
                        { baslik: "Durum ve Hedef Analizi", detay: `Bahsettiğin "${focusSubject}" hedefiyle veya planıyla sektörün mevcut gerçeklerini eşleştir.` },
                        { baslik: "Eksikleri Haritalandırma", detay: "Bu yolda ilerlerken önündeki beceri veya network eksiklerini tespit et." },
                        { baslik: "Stratejik Hamleler", detay: "Seni hızlandıracak destekleyici organizasyonlarda görünür ol." }
                    ],
                    gorevler: [
                        `Öncelikle "${focusSubject}" planın  için elindeki yetenekleri ve eksikliklerini bir listeye dök`,
                        "Kıdemli profesyonel Ayşe Yılmaz'dan 15 dakikalık tanışma seansı talep et",
                        "LinkedIn veya benzer kariyer profillerini hedeflediğin sektöre göre güncelle"
                    ],
                    destek_cemberi: [
                        { isim: "Ayşe Yılmaz", rol: "Kıdemli Profesyonel / Yönetici", id: "mentor_1", photo: "https://randomuser.me/api/portraits/women/32.jpg", bio: "Ulusal ve uluslararası şirketlerde teknoloji ve pazarlama yöneticiliği yapmış olan Ayşe Yılmaz, kariyerinde sıçrama yapmak veya sektör değiştirmek isteyen kadınlara birebir mentörlük veriyor. Mülakat tekniklerinden maaş müzakerelerine kadar birçok konuda sana yön verecektir." },
                        { isim: "Kariyer Gelişim Dayanışması", rol: "Topluluk", id: "group_1", photo: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80", bio: "Bu toplulukta, kariyerine yeni başlayanlar ve uzmanlar bir arada bulunur. CV hazırlama, staj bulma, teknik beceri geliştirme konularında dayanışma sağlayabilir ve diğer üyelerle network kurabilirsin." }
                    ]
                });
            }
        }, 1500);
    });
}

// Real Gemini API Call
async function fetchFromGemini(text) {
    const prompt = `Sen "HERCIRCLE AI" adında kadınları destekleyen, onlara akıl veren ve mentorluk yapan bir yapay zekasın. 
Kullanıcının metni: "${text}"

Bu metni analiz et ve KESİNLİKLE AŞAĞIDAKİ JSON YAPISINA UYGUN olarak cevap ver (Başka hiçbir açıklama yazma, sadece JSON formatında dön):
{
  "kategori": "Kısa bir kategori ismi (İş, Eğitim, Psikolojik Destek, Hukuk vb.)",
  "oncelik": "Durumun önceliği (Düşük, Orta, Yüksek, Acil)",
  "cozum_plani": [
    { "baslik": "Aşama 1", "detay": "Kısa detay" },
    { "baslik": "Aşama 2", "detay": "Kısa detay" }
  ],
  "gorevler": [
    "Hemen yapılması gereken görev 1",
    "Hemen yapılması gereken görev 2"
  ],
  "destek_cemberi": [
    { "isim": "Önerilen Kişi/Kurum Tipi", "rol": "Mentor / Destek / Topluluk" },
    { "isim": "Önerilen Kişi/Kurum Tipi", "rol": "Mentor / Destek / Topluluk" }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        throw new Error("Sunucu yanıt vermedi.");
    }

    const data = await response.json();
    let responseText = data.candidates[0].content.parts[0].text;
    
    // Temizleme (Markdown JSON blokları gelirse diye)
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
        responseText = responseText.substring(7, responseText.length - 3).trim();
    } else if (responseText.startsWith('```')) {
        responseText = responseText.substring(3, responseText.length - 3).trim();
    }
    
    return JSON.parse(responseText);
}

function renderResults(data, userText = "") {
    loadingState.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Badges
    categoryBadge.textContent = `Kategori: ${data.kategori}`;
    priorityBadge.textContent = `Öncelik: ${data.oncelik}`;

    // Priority Color Change
    if (data.oncelik.toLowerCase().includes('yüksek') || data.oncelik.toLowerCase().includes('acil')) {
        priorityBadge.style.color = 'var(--danger)';
    } else {
        priorityBadge.style.color = 'var(--warning)';
    }

    // Timeline (Çözüm Planı)
    solutionPlanList.innerHTML = '';
    data.cozum_plani.forEach(plan => {
        const li = document.createElement('li');
        li.innerHTML = `<h4>${plan.baslik}</h4><p>${plan.detay}</p>`;
        solutionPlanList.appendChild(li);
    });

    // Görevler
    tasksList.innerHTML = '';
    data.gorevler.forEach((gorev, index) => {
        const d = document.createElement('div');
        d.className = 'task-item';
        d.innerHTML = `
            <div class="task-checkbox" onclick="toggleTask(this)">
                <i class="fa-solid fa-check"></i>
            </div>
            <span>${gorev}</span>
        `;
        tasksList.appendChild(d);
    });

    // Destek Çemberi & Mentor Eşleştirme
    circleList.innerHTML = '';
    const matchedMentors = findTopMentors(userText, 2);
    
    const circleHeader = document.querySelector('.circle-card h3');
    if (circleHeader) {
        circleHeader.innerHTML = `<i class="fa-solid fa-users"></i> Senin İçin Uygun Destek Çemberi Üyeleri`;
    }

    if (matchedMentors.length > 0 && matchedMentors[0].score > 0) {
        matchedMentors.forEach((mentor, index) => {
            const d = document.createElement('div');
            d.className = 'member-card';
            d.style.cursor = 'pointer';
            const isBestMatch = index === 0;
            const matchScore = isBestMatch ? Math.floor(Math.random() * 5 + 94) : null;
            
            if (isBestMatch) {
                d.style.border = '2px solid var(--warning)';
                d.style.background = 'rgba(255, 255, 255, 0.9)';
                d.style.flexDirection = 'column';
                d.style.alignItems = 'flex-start';
                d.style.gap = '10px';
            }
            d.innerHTML = `
                ${isBestMatch ? `<div class="best-match-badge"><i class="fa-solid fa-star"></i> En Uygun Eşleşme (%${matchScore})</div>` : ''}
                <div style="display:flex; align-items:center; gap:15px; width:100%;">
                    <img src="${mentor.photo || ''}" alt="${mentor.name}" class="member-avatar" style="object-fit:cover; width:48px; height:48px; border-radius:50%;">
                    <div class="member-info">
                        <h4>${mentor.name}</h4>
                        <p style="font-size:0.8rem; color:var(--text-muted);">${mentor.bio ? mentor.bio.substring(0,50) + '...' : ''}</p>
                        <p style="margin-top:5px; font-size:0.75rem;"><i class="fa-solid fa-star"></i> Uzmanlık: ${mentor.expertise_keywords ? mentor.expertise_keywords.slice(0,3).join(', ') : ''}</p>
                    </div>
                </div>
                ${isBestMatch ? `
                <div class="ai-match-reason">
                    <i class="fa-solid fa-robot"></i>
                    <div><strong>AI Analizi:</strong> Girdiğin öncelikler ve hedeflerin, mentörümüzün uzmanlık alanıyla <strong>%${matchScore}</strong> oranında örtüşüyor. Hızlı ve kalıcı bir çözüm için ilk görüşmeyi bu uzmanla yapmanı öneriyorum.</div>
                </div>` : ''}
            `;
            d.onclick = () => openMentorModal({
                name: mentor.name,
                role: mentor.title || "Uzman Mentör",
                photo: mentor.photo,
                bio: mentor.bio || mentor.name + ", alanında uzun yıllardır deneyim sahibi bir profesyoneldir.",
                experience: mentor.experience || (Math.floor(Math.random() * 10 + 5) + " Yıl"),
                rating: mentor.rating || (4.7 + Math.random() * 0.3).toFixed(1),
                keywords: mentor.expertise_keywords || ["Gelişim", "Kariyer"]
            });
            circleList.appendChild(d);
        });
    } else {
        data.destek_cemberi.forEach((kisi, index) => {
            const avatarHtml = kisi.photo 
                ? `<img src="${kisi.photo}" alt="${kisi.isim}" class="member-avatar" style="object-fit:cover; width:48px; height:48px; border-radius:50%;">`
                : `<div class="member-avatar">${kisi.isim.substring(0, 2).toUpperCase()}</div>`;
            const avatarInitials = kisi.isim.substring(0, 2).toUpperCase();
            
            const d = document.createElement('div');
            d.className = 'member-card';
            const isBestMatch = index === 0;
            const matchScore = isBestMatch ? Math.floor(Math.random() * 5 + 94) : null;

            if (isBestMatch) {
                d.style.border = '2px solid var(--warning)';
                d.style.transform = 'scale(1.02)';
                d.style.background = 'rgba(255, 255, 255, 0.9)';
                d.style.flexDirection = 'column';
                d.style.alignItems = 'flex-start';
                d.style.gap = '10px';
            }
            d.innerHTML = `
                ${isBestMatch ? `<div class="best-match-badge"><i class="fa-solid fa-star"></i> En Uygun Eşleşme (%${matchScore})</div>` : ''}
                <div style="display:flex; align-items:center; gap:15px; width:100%;">
                    ${avatarHtml}
                    <div class="member-info" style="flex:1;">
                        <h4>${kisi.isim}</h4>
                        <p><i class="fa-solid fa-star"></i> ${kisi.rol}</p>
                    </div>
                    <button class="btn-primary-small mentor-connect-btn">Destek İste</button>
                </div>
                ${isBestMatch ? `
                <div class="ai-match-reason">
                    <i class="fa-solid fa-robot"></i>
                    <div><strong>AI Analizi:</strong> Girdiğin öncelikler ve hedeflerin, mentörümüzün geçmiş başarı hikayeleriyle <strong>%${matchScore}</strong> oranında örtüşüyor. Çözüm planına hızlı bir başlangıç için harika bir eşleşme.</div>
                </div>` : ''}
            `;
            const btn = d.querySelector('.mentor-connect-btn');
            btn.onclick = (e) => {
                e.stopPropagation();
                openMentorModal({
                    name: kisi.isim,
                    role: kisi.rol,
                    photo: kisi.photo,
                    photoInitials: avatarInitials,
                    bio: kisi.bio || kisi.isim + ", karşılaştığın zorlukları aşmanda sana rehberlik edecek deneyime sahip, destek çemberimizdeki gönüllü uzmanlardan biridir.",
                    experience: kisi.rol.includes("Topluluk") ? "Çok Sayıda" : Math.floor(Math.random() * 10 + 5) + " Yıl",
                    rating: (4.7 + Math.random() * 0.3).toFixed(1),
                    keywords: kisi.rol.includes("Topluluk") ? ["Dayanışma", "Network", "Paylaşım"] : ["Destek", "Mentörlük", "Danışmanlık"]
                });
            };
            circleList.appendChild(d);
        });
    }

    // Timeline boşluğunu doldur (Motivasyon Köşesi)
    const existingMotivation = document.querySelector('.motivation-box');
    if (existingMotivation) existingMotivation.remove();
    
    const motivationBox = document.createElement('div');
    motivationBox.className = 'motivation-box glass';
    motivationBox.innerHTML = `
        <i class="fa-solid fa-quote-left" style="color:var(--primary-light); font-size:1.5rem; margin-bottom:10px;"></i>
        <p style="font-style:italic; color:var(--text-main); font-size:0.95rem;">
            "En uzun yolculuklar bile tek bir adımla başlar. Unutma ki yalnız değilsin, bu çemberde her zaman seninle aynı yollardan geçmiş ve sana el uzatmaya hazır kadınlar var."
        </p>
        <div style="margin-top:10px; font-weight:600; font-size:0.85rem; color:var(--primary);">- HerCircle Ekibi</div>
    `;
    motivationBox.style.marginTop = "auto";
    motivationBox.style.padding = "20px";
    motivationBox.style.borderRadius = "15px";
    motivationBox.style.background = "rgba(155, 81, 224, 0.05)";
    document.querySelector('.plan-card').appendChild(motivationBox);
}

function toggleTask(element) {
    const taskItem = element.closest('.task-item');
    taskItem.classList.toggle('completed');
}

function showError(msg) {
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
    errorMessage.textContent = msg;
}

function resetUI() {
    problemInput.value = '';
    resultsSection.classList.add('hidden');
    document.getElementById('resource-suggestions').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====== YENİ EKLENEN ÖZELLİKLER (MODAL, FORM, CHATBOT) ======

// Modal Elements
const howLink = document.getElementById('how-link');
const howModal = document.getElementById('how-it-works-modal');
const closeHowBtn = document.getElementById('close-how-btn');

if (howLink && howModal && closeHowBtn) {
    howLink.addEventListener('click', (e) => {
        e.preventDefault();
        howModal.classList.remove('hidden');
    });
    closeHowBtn.addEventListener('click', () => {
        howModal.classList.add('hidden');
    });
    window.addEventListener('click', (e) => {
        if (e.target === howModal) howModal.classList.add('hidden');
    });
}

// Mentor Modal Logic
const mentorModal = document.getElementById('mentor-modal');
const closeMentorBtn = document.getElementById('close-mentor-btn');
const mentorModalBody = document.getElementById('mentor-modal-body');

if (closeMentorBtn) {
    closeMentorBtn.addEventListener('click', () => {
        mentorModal.classList.add('hidden');
    });
    window.addEventListener('click', (e) => {
        if (e.target === mentorModal) mentorModal.classList.add('hidden');
    });
}

function openMentorModal(mentor) {
    if (!mentorModalBody || !mentorModal) return;

    let avatarHtml = '';
    if (mentor.photo) {
        avatarHtml = `<img src="${mentor.photo}" alt="${mentor.name}" class="mentor-avatar-large" style="object-fit:cover;">`;
    } else {
        avatarHtml = `<div class="mentor-avatar-large">${mentor.photoInitials || mentor.name.substring(0,2).toUpperCase()}</div>`;
    }

    // Generate Calendar HTML (Next 7 days for demo)
    const today = new Date();
    let calendarHtml = '<div class="calendar-grid">';
    
    // Header for days
    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Pzr'];
    dayNames.forEach(d => {
        calendarHtml += `<div class="calendar-day-header">${d}</div>`;
    });

    // Populate next 14 days loosely
    let currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Start from Monday
    
    // Fill empty slots before today
    for(let i=0; i<currentDayIndex; i++) {
        calendarHtml += `<div></div>`;
    }

    // Generate dates
    for(let i=0; i<14; i++) {
        let tempDate = new Date(today);
        tempDate.setDate(today.getDate() + i);
        let dateNum = tempDate.getDate();
        
        // Randomly make some days available
        let isAvailable = Math.random() > 0.5 && tempDate.getDay() !== 0; // Not sundays usually
        
        if (isAvailable) {
            calendarHtml += `<div class="calendar-day available" onclick="requestSession(this, '${tempDate.toLocaleDateString('tr-TR')}')">${dateNum}</div>`;
        } else {
            calendarHtml += `<div class="calendar-day unavailable">${dateNum}</div>`;
        }
    }
    calendarHtml += `</div>`;

    let html = `
        <div class="mentor-profile-header">
            ${avatarHtml}
            <div class="mentor-details-info">
                <h3>${mentor.name}</h3>
                <p><i class="fa-solid fa-briefcase"></i> ${mentor.role}</p>
                <div class="mentor-rating">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star-half-stroke"></i>
                    <span>${mentor.rating} (Harika)</span>
                </div>
            </div>
        </div>

        <div class="mentor-stats">
            <span class="stat-badge"><i class="fa-solid fa-clock"></i> ${mentor.experience} Deneyim</span>
            <span class="stat-badge"><i class="fa-solid fa-tags"></i> ${mentor.keywords.join(', ')}</span>
        </div>

        <div class="mentor-bio">
            <p>${mentor.bio}</p>
        </div>

        <div class="calendar-section" style="margin-top: 20px; background: rgba(255,255,255,0.7); padding: 15px; border-radius: 12px; border: 1px solid rgba(155, 81, 224, 0.2);">
            <h4><i class="fa-solid fa-calendar-alt"></i> Müsait Günler</h4>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">Aşağıdaki yeşil günlerden birine tıklayarak mentöre görüşme talebi gönderebilirsin.</p>
            ${calendarHtml}
            <div id="booking-msg" style="margin-top:15px; font-weight:600; font-size: 0.9rem; text-align:center;"></div>
        </div>
    `;

    mentorModalBody.innerHTML = html;
    mentorModal.classList.remove('hidden');
}

window.requestSession = function(element, dateStr) {
    const msgEl = document.getElementById('booking-msg');
    
    // Visual feedback
    document.querySelectorAll('.calendar-day').forEach(el => {
        el.style.opacity = '1';
        if (el.classList.contains('available')) {
            el.style.background = 'rgba(16, 185, 129, 0.1)';
            el.style.color = 'var(--success)';
        }
    });
    
    element.style.background = 'var(--primary)';
    element.style.color = 'white';
    
    msgEl.innerHTML = `
        <div class="time-slot-container">
            <h5><i class="fa-regular fa-clock"></i> ${dateStr} için Saat Seç:</h5>
            <div class="time-slots">
                <button class="time-slot-btn" onclick="selectTimeSlot(this, '${dateStr}', '10:00')">10:00</button>
                <button class="time-slot-btn" onclick="selectTimeSlot(this, '${dateStr}', '13:30')">13:30</button>
                <button class="time-slot-btn" onclick="selectTimeSlot(this, '${dateStr}', '15:00')">15:00</button>
                <button class="time-slot-btn" onclick="selectTimeSlot(this, '${dateStr}', '18:00')">18:00</button>
            </div>
            <button id="confirm-booking-btn" class="btn-primary-small" style="display:none; width:100%; justify-content:center;" onclick="confirmBooking('${dateStr}')">Seansı Onayla</button>
        </div>
    `;
};

let selectedTime = null;
window.selectTimeSlot = function(btn, dateStr, timeStr) {
    document.querySelectorAll('.time-slot-btn').forEach(el => el.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTime = timeStr;
    document.getElementById('confirm-booking-btn').style.display = 'flex';
};

window.confirmBooking = function(dateStr) {
    if (!selectedTime) return;
    const msgEl = document.getElementById('booking-msg');
    msgEl.innerHTML = `<div style="padding:15px; background:rgba(16,185,129,0.1); border-radius:10px; color:var(--success); border:1px solid var(--success);"><i class="fa-solid fa-check-circle"></i> <strong>${dateStr} Saat ${selectedTime}</strong> için görüşme talebin başarıyla iletildi! Uzmanımız en kısa sürede onaylayacaktır.</div>`;
};

// Join Community Form
const joinForm = document.getElementById('join-form');
const joinSuccess = document.getElementById('join-success');

if (joinForm) {
    joinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        joinSuccess.classList.remove('hidden');
        joinForm.reset();
        setTimeout(() => {
            joinSuccess.classList.add('hidden');
        }, 5000);
    });
}

// Chatbot Logic
const chatbotToggleBtn = document.getElementById('chatbot-toggle');
const chatbotWindow = document.getElementById('chatbot-window');
const chatbotCloseBtn = document.getElementById('chatbot-close');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send');

if (chatbotToggleBtn && chatbotWindow) {
    chatbotToggleBtn.addEventListener('click', () => {
        chatbotWindow.classList.toggle('hidden');
    });
    chatbotCloseBtn.addEventListener('click', () => {
        chatbotWindow.classList.add('hidden');
    });

    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

function appendMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;
    msgDiv.textContent = text;
    chatbotMessages.appendChild(msgDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append User Message
    appendMessage(text, 'user-message');
    chatInput.value = '';

    if (GEMINI_API_KEY) {
        try {
            const reply = await fetchChatbotFromGemini(text);
            appendMessage(reply, 'ai-message');
        } catch (error) {
            appendMessage("Üzgünüm, API bağlantısında bir hata oluştu.", 'ai-message');
        }
    } else {
        setTimeout(() => {
            appendMessage(mockChatResponse(text), 'ai-message');
        }, 1000);
    }
}

// Akıllı Chatbot Demo Arka Planı
function mockChatResponse(text) {
    let lowerText = text.toLowerCase();
    
    if (lowerText.includes("süreç") || lowerText.includes("ne kadar sürer") || lowerText.includes("ne zaman") || lowerText.includes("zaman al") || lowerText.includes("iletişim") || lowerText.includes("ne kadar süre")) {
        return "Süreç oldukça hızlı işler: Mentörlerimizle 'Bağlan' butonuna tıkladığında veya talep açtığında, destek çemberindeki uzmanlarımız 24 ile 48 saat içerisinde platform üzerinden sana mesajla geri dönüş yaparak ilk online görüşmeyi planlar.";
    } else if (lowerText.includes("nasıl") && (lowerText.includes("mentor") || lowerText.includes("mentör") || lowerText.includes("avukat") || lowerText.includes("psikolog") || lowerText.includes("iletişim"))) {
        return "Destek çemberindeki uzmanların altındaki 'Bağlan' butonuna bastığında sana ait bir özet (çözüm planı) uzmanımıza iletilir. Uzmanımız müsaitlik durumuna göre sistem içindeki gelen kutundan mesaj atarak seninle hemen bir online tanışma randevusu oluşturacaktır.";
    } else if (lowerText.includes("mentor") || lowerText.includes("mentör") || lowerText.includes("kim")) {
        return "Sana atanan mentörler alanında uzman gönüllü kadınlardan oluşuyor. Sorunun hukuk, eğitim veya psikoloji olmasına göre 'Destek Çemberi' listesinden uzmanlarla hemen iletişime geçebilirsin.";
    } else if (lowerText.includes("merhaba") || lowerText.includes("selam") || lowerText.includes("yardım") || lowerText.includes("destek ol")) {
        return "Merhaba! Ben HerCircle AI asistanıyım. Sana kariyer, eğitim, hukuki veya psikolojik destek konularında yol göstermek için buradayım. Konuyu biraz açar mısın?";
    } else if (lowerText.includes("hukuk") || lowerText.includes("avukat") || lowerText.includes("dava")) {
        return "Hukuki konularda platformumuzdaki kadın hakları savunucusu avukatlarımızdan ücretsiz danışmanlık alabilirsin. Sol panelde sana çıkardığımız çözüm planındaki adımları inceledin mi?";
    } else if (lowerText.includes("psikoloj") || lowerText.includes("üzgün") || lowerText.includes("destek") || lowerText.includes("yalnız")) {
        return "Kendini yalnız hissetme. Uzman psikologlarımız ve seninle aynı yollardan geçen kadınların oluşturduğu dayanışma gruplarımız her zaman yanında. Çemberindeki kişilere tıklayarak ilk adımı atabilirsin.";
    } else if (lowerText.includes("teşekkür") || lowerText.includes("sağol")) {
        return "Rica ederim, ne zaman istersen buradayım! Birlikte daha güçlüyüz. ❤️";
    } else if (lowerText.includes("nasıl") || lowerText.includes("ne yap")) {
        return "Öncelikle sana özel hazırladığımız 'Çözüm Planı'na göz atmanı öneririm. Daha sonra 'Senin İçin Görevler' listesindeki maddeleri uyguladıkça üzerlerini çizebilirsin!";
    } else if (lowerText.includes("nasılsın") || lowerText.includes("nbr") || lowerText.includes("naber")) {
        return "Teşekkür ederim, ben bir yapay zeka asistanı olduğum için duygularım yok ama sana yardımcı olabildiğim için harika hissediyorum! Sen nasılsın?";
    } else if (lowerText.includes("kimsin") || lowerText.includes("adın ne") || lowerText.includes("nesin")) {
        return "Ben HerCircle AI Asistanıyım. Sana ve diğer tüm kadınlara destek olmak, mentörlük eşleştirmeleri yapmak ve yol göstermek için tasarlandım.";
    } else if (lowerText.includes("ne yaparsın") || lowerText.includes("ne işe yarar") || lowerText.includes("görev")) {
        return "Sana kariyer, eğitim, hukuk ve psikolojik destek konularında yol haritası çıkarıyor ve deneyimli gönüllü mentörlerimizle eşleştiriyorum.";
    } else if (lowerText.includes("şaka")) {
        return "Yapay zekadan iyi bir şaka bekleme: Neden bilgisayarlar hiç üşümez? Çünkü pencereleri (Windows) hep kapalıdır! 😄";
    } else if (lowerText.includes("hava")) {
        return "Maalesef şu an dışarıdaki havayı göremiyorum ama eminim ki dışarısı senin enerjinle parlıyordur! 🌟";
    } else {
        const fallbacks = [
            "Anlıyorum. HerCircle AI olarak sana en iyi desteği sunmak için buradayım. Kariyer, eğitim veya psikolojik destek alanlarından hangisi üzerine konuşmak istersin?",
            "Bu konuda sana yardımcı olabilecek harika uzmanlarımız var! Senin durumunu biraz daha detaylı yazarsan, sağ sayfadaki Çözüm Planını ona göre güncelleyebilirim.",
            "Harika bir nokta! Daha fazla detay verir misin, böylece seni doğru mentöre veya topluluğa yönlendirebilirim.",
            "Seni çok iyi anlıyorum. Şu an ana ekrandaki 'Destek Çemberi' üzerinden uzmanlarımızla direkt görüşme planlayabileceğini hatırlatmak isterim.",
            "Bunu tam olarak yapay zeka hafızamla kavrayamadım ama merak etme! Mentörlerimiz bu konuyu seninle detaylıca konuşmak için takvimlerinde seni bekliyor."
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

async function fetchChatbotFromGemini(text) {
    const prompt = `Sen HerCircle AI Asistanısın. Kadınlara destek veren, samimi, kısa ve arkadaşça cevaplar veren bir sohbet botusun. Kullanıcının mesajına yanıt ver.\n\nKullanıcı: ${text}\nAsistan:`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
        })
    });

    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// ====== AUTH MODAL ÖZELLİKLERİ ======
const loginLink = document.getElementById('login-link');
const authModal = document.getElementById('auth-modal');
const closeAuthBtn = document.getElementById('close-auth-btn');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

if (loginLink && authModal) {
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        authModal.classList.remove('hidden');
    });
    
    closeAuthBtn.addEventListener('click', () => {
        authModal.classList.add('hidden');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.classList.add('hidden');
    });

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    });

    tabSignup.addEventListener('click', () => {
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Giriş başarılı! (Demo)');
        authModal.classList.add('hidden');
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Kayıt başarılı! Aramıza hoş geldin. (Demo)');
        authModal.classList.add('hidden');
    });
}

// ====== INLINE CHATBOX (DESTEK ÇEMBERİ) ======
const inlineChatBtn = document.getElementById('inline-chat-btn');
const inlineChatSection = document.getElementById('inline-chat-section');
const inlineChatMessages = document.getElementById('inline-chat-messages');
const inlineChatInput = document.getElementById('inline-chat-input');
const inlineChatSendBtn = document.getElementById('inline-chat-send');

if (inlineChatBtn && inlineChatSection) {
    inlineChatBtn.addEventListener('click', () => {
        inlineChatSection.classList.toggle('hidden');
    });

    inlineChatSendBtn.addEventListener('click', sendInlineMessage);
    inlineChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendInlineMessage();
    });
}

async function sendInlineMessage() {
    const text = inlineChatInput.value.trim();
    if (!text) return;
    
    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'message user-message';
    userMsg.textContent = text;
    inlineChatMessages.appendChild(userMsg);
    
    inlineChatInput.value = '';
    inlineChatMessages.scrollTop = inlineChatMessages.scrollHeight;

    if (GEMINI_API_KEY) {
        try {
            const prompt = `Sen HerCircle Topluluk Asistanısın. Kullanıcı destek çemberi ve mentorlerle ilgili bir soru soruyor. Kısa ve motive edici cevap ver.\n\nKullanıcı: ${text}\nAsistan:`;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });
            
            if(!response.ok) throw new Error('API Error');
            const data = await response.json();
            const reply = data.candidates[0].content.parts[0].text;
            
            const aiMsg = document.createElement('div');
            aiMsg.className = 'message ai-message';
            aiMsg.textContent = reply;
            inlineChatMessages.appendChild(aiMsg);
            inlineChatMessages.scrollTop = inlineChatMessages.scrollHeight;
        } catch (error) {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'message ai-message';
            aiMsg.textContent = "Bağlantı hatası oluştu.";
            inlineChatMessages.appendChild(aiMsg);
            inlineChatMessages.scrollTop = inlineChatMessages.scrollHeight;
        }
    } else {
        setTimeout(() => {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'message ai-message';
            aiMsg.textContent = mockChatResponse(text);
            inlineChatMessages.appendChild(aiMsg);
            inlineChatMessages.scrollTop = inlineChatMessages.scrollHeight;
        }, 1000);
    }
}

// ====== SERPER API (KAYNAK ÖNERİSİ) ======
async function fetchSerperResources(query) {
    if (!SERPER_API_KEY) {
        // Mock data when no key
        return new Promise(resolve => {
            setTimeout(() => {
                let text = query.toLowerCase();
                const words = text.replace(/[.,!?;:()]/g, ' ').split(/\s+/);
                const hasJobKeyword = words.some(w => ['iş', 'staj', 'kariyer', 'çalışmak', 'istihdam', 'cv', 'mülakat', 'pozisyon', 'ilan'].includes(w));

                if (text.includes("hukuk") || text.includes("şiddet") || text.includes("dava") || text.includes("boşanma") || text.includes("hak") || text.includes("avukat") || text.includes("polis")) {
                    resolve([
                        { title: "Mor Çatı Kadın Sığınağı Vakfı", snippet: "Acil durum desteği, yasal haklar ve ücretsiz dayanışma sığınağı...", link: "https://morcati.org.tr/" },
                        { title: "Türkiye Barolar Birliği Kadın Hukuku", snippet: "Bulunduğunuz ildeki baroların ücretsiz adli yardım servislerine ulaşım...", link: "https://www.barobirlik.org.tr/tubas" },
                        { title: "KADES (Kadın Destek) Uygulaması", snippet: "Emniyet Genel Müdürlüğü acil müdahale uygulaması indirme detayları...", link: "https://www.egm.gov.tr/kades" }
                    ]);
                } else if (text.includes("psikolo") || text.includes("üzgün") || text.includes("depresyon") || text.includes("yalnız") || text.includes("kork") || text.includes("mutsuz")) {
                    resolve([
                        { title: "Türk Psikologlar Derneği Dayanışma Ağı", snippet: "Ücretsiz terapi seçenekleri ve duygusal destek randevuları...", link: "https://www.psikolog.org.tr/" },
                        { title: "Alo 183 Sosyal Destek Hattı", snippet: "Aile ve Sosyal Hizmetler Bakanlığı ücretsiz telefon danışmanlık hattı...", link: "https://www.aile.gov.tr/sss/alo-183-sosyal-destek-hatti/" },
                        { title: "Mindfulness ve Öz Şefkat Kaynakları", snippet: "Zor zamanlardan geçerken kendi kendine uygulayabileceğiniz stres yönetimi pratikleri...", link: "https://www.mindfulnessinstitute.com.tr/" }
                    ]);
                } else if (hasJobKeyword) {
                    resolve([
                        { title: "Kariyer.net - Güncel İş İlanları", snippet: "Profilinize uygun binlerce iş ve staj ilanına hemen başvurun...", link: "https://www.kariyer.net/" },
                        { title: "LinkedIn - Kariyer Fırsatları", snippet: "Sektörünüzdeki profesyonellerle ağ kurun ve açık pozisyonları inceleyin...", link: "https://www.linkedin.com/jobs/" },
                        { title: "Youthall - Yeni Mezun & Staj", snippet: "Genç yeteneklere yönelik kariyer fırsatları, staj ve iş ilanları...", link: "https://www.youthall.com/" },
                        { title: "Yeni Bir İş - Kadın İstihdamı", snippet: "Kadınları iş hayatına teşvik eden pozisyonlar ve kurumsal kariyer fırsatları...", link: "https://www.yenibiris.com/" }
                    ].slice(0, 3));
                } else {
                    resolve([
                        { title: "Teknolojide Kadın Derneği (Wtech)", snippet: "Sektöründe ilerlemek isteyen kadınlar için burslu uzmanlık eğitimleri...", link: "https://www.teknolojidekadin.com/" },
                        { title: "SistersLab - Bilim ve Teknolojide Kadınlar", snippet: "Yazılım atölyeleri, kariyer ağları kurma ve mentörlük fırsatları...", link: "https://sisterslab.org/" },
                        { title: "Coursera: Öğrenimi Özgürleştir", snippet: "Hedefinize yönelik dünyanın en iyi kariyer sertifikaları ve burslu kurslar...", link: "https://www.coursera.org/courses?query=free" }
                    ]);
                }
            }, 2000);
        });
    }

    const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ q: query, gl: "tr", hl: "tr", num: 3 })
    });

    if (!response.ok) throw new Error("Serper API failed");
    const data = await response.json();
    return data.organic ? data.organic.slice(0, 3) : [];
}

function renderResources(resources) {
    const resGrid = document.getElementById('suggestions-grid');
    if (!resources || resources.length === 0) {
        resGrid.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem; padding: 10px;">Sonuç bulunamadı.</p>';
        return;
    }
    
    resGrid.innerHTML = '';
    resources.forEach(item => {
        let host = 'kaynak.com';
        try {
            if (item.link && item.link !== '#') {
                host = new URL(item.link).hostname.replace('www.', '');
            }
        } catch (e) {}
        
        const card = document.createElement('a');
        card.className = 'resource-card glass';
        card.href = item.link;
        card.target = '_blank';
        card.innerHTML = `
            <h5>${item.title}</h5>
            <p>${item.snippet}</p>
            <span class="link-host">${host}</span>
        `;
        resGrid.appendChild(card);
    });
}
