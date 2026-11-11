(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  /*
   * VERİ DOSYASI (2. AŞAMA TAM SÜRÜM)
   * 4 duvar, 9 nesne, kart içerikleri, eşleştirme çiftleri ve değerlendirme soruları.
   * Kart metinleri ve sorular yer tutucudur; doğrudan bu dosyadan düzenlenebilir.
   */
  Cezeri.data = {
    title: "Cezeri’nin Çocukluk Odası",
    introMission: "Odanın dört duvarını gezerek Cezeri’nin çocukluk yıllarına ait 9 eşyayı bul, ardından eşleştirme ve kısa değerlendirmeyi tamamla.",
    disclaimer: "Canlandırma: Cezeri’nin çocukluk odası kaynaklarda belgelenmemiştir, tahmine dayalı bir yeniden kurgudur.",

    totalObjectCount: 9,

    // 4 Duvar (assets/img/duvar1.webp ... duvar4.webp konulduğunda otomatik yüklenir)
    walls: [
      {
        id: "duvar1",
        order: 1,
        name: "1. Duvar: Çalışma Köşesi",
        shortName: "Çalışma Köşesi",
        image: "assets/img/duvar1.webp",
        ariaLabel: "1. Duvar: Çalışma Köşesi. Cezeri’nin yazı ve çizim araçlarının bulunduğu çalışma alanı.",
        placeholder: {
          bgGradient: "linear-gradient(155deg, #3b281c 0%, #5b3d28 52%, #291b12 100%)",
          accentColor: "#e4a93c",
          subtitle: "Yer Tutucu Görsel • assets/img/duvar1.webp",
          description: "Çalışma köşesi: ahşap rahle, kamış kalem ve mürekkeplik"
        }
      },
      {
        id: "duvar2",
        order: 2,
        name: "2. Duvar: Mekanik Raf",
        shortName: "Mekanik Raf",
        image: "assets/img/duvar2.webp",
        ariaLabel: "2. Duvar: Mekanik Raf. Küçük düzeneklerin ve modellerin sergilendiği raf bölümü.",
        placeholder: {
          bgGradient: "linear-gradient(155deg, #24343b 0%, #3a525c 52%, #192328 100%)",
          accentColor: "#78c0a8",
          subtitle: "Yer Tutucu Görsel • assets/img/duvar2.webp",
          description: "Mekanik raf: mekanik kuş maketi ve hareketli kukla"
        }
      },
      {
        id: "duvar3",
        order: 3,
        name: "3. Duvar: Oyma Atölyesi",
        shortName: "Oyma Atölyesi",
        image: "assets/img/duvar3.webp",
        ariaLabel: "3. Duvar: Oyma Atölyesi. Ahşap yontma araçları ve taslak sayfaların bulunduğu tezgah.",
        placeholder: {
          bgGradient: "linear-gradient(155deg, #36252b 0%, #543741 52%, #23171b 100%)",
          accentColor: "#e09f7d",
          subtitle: "Yer Tutucu Görsel • assets/img/duvar3.webp",
          description: "Oyma atölyesi: ahşap oyma takımı ve yazılı taslak sayfalar"
        }
      },
      {
        id: "duvar4",
        order: 4,
        name: "4. Duvar: Pencere ve Yer Yatağı",
        shortName: "Pencere ve Yer Yatağı",
        image: "assets/img/duvar4.webp",
        ariaLabel: "4. Duvar: Pencere ve Yer Yatağı. Küçük pencere ve akşam okumaları için mumun yer aldığı bölüm.",
        placeholder: {
          bgGradient: "linear-gradient(155deg, #22293a 0%, #34415c 52%, #151a26 100%)",
          accentColor: "#9dc4f0",
          subtitle: "Yer Tutucu Görsel • assets/img/duvar4.webp",
          description: "Pencere ve yer yatağı: küçük taş pencere ve mum"
        }
      }
    ],

    // 9 Nesne: rahle, kamış kalem, mürekkeplik, mekanik kuş, kukla, oyma takımı, yazılı sayfalar, küçük pencere, mum
    objects: [
      {
        id: "rahle",
        wallId: "duvar1",
        name: "Rahle",
        x: 34.0,
        y: 66.0,
        image: "assets/img/nesne-rahle.webp",
        imagePlaceholderLabel: "Ahşap Rahle",
        ariaLabel: "Rahle nesnesini incele",
        tabs: {
          donem: {
            heading: "O zaman ne işe yarardı?",
            text: "[Yer tutucu içerik] 12. yüzyılda kitap okumak, el yazmalarını incelemek ve çizim yapmak için kullanılan açılır kapanır ahşap yazı ve okuma sehpasıydı."
          },
          bugun: {
            heading: "Günümüz karşılığı",
            text: "[Yer tutucu içerik] Günümüzde kullandığımız eğimli çalışma masaları, kitap tutucular ve tablet/dizüstü bilgisayar stantları aynı ergonomi ihtiyacını karşılar."
          }
        }
      },
      {
        id: "kamis-kalem",
        wallId: "duvar1",
        name: "Kamış Kalem",
        x: 52.0,
        y: 57.5,
        image: "assets/img/nesne-kamis-kalem.webp",
        imagePlaceholderLabel: "Kamış Kalem",
        ariaLabel: "Kamış Kalem nesnesini incele",
        tabs: {
          donem: {
            heading: "O zaman ne işe yarardı?",
            text: "[Yer tutucu içerik] Kurutulmuş kamışın ucunun eğik yontulmasıyla hazırlanan bu kalem, hem hat yazılarında hem de mekanik tasarım taslaklarının çiziminde kullanılırdı."
          },
          bugun: {
            heading: "Günümüz karşılığı",
            text: "[Yer tutucu içerik] Bugün yerini dolma kalemlere, teknik çizim kalemlerine (rapido) ve dijital çizim kalemlerine (stylus) bırakmıştır."
          }
        }
      },
      {
        id: "murekkeplik",
        wallId: "duvar1",
        name: "Mürekkeplik (Hokka)",
        x: 65.5,
        y: 64.0,
        image: "assets/img/nesne-murekkeplik.webp",
        imagePlaceholderLabel: "Mürekkeplik",
        ariaLabel: "Mürekkeplik nesnesini incele",
        tabs: {
          donem: {
            heading: "O zaman ne işe yarardı?",
            text: "[Yer tutucu içerik] İçinde doğal is ve zamktan üretilen mürekkebin tutulduğu, taşmayı önlemek için içine ham ipek (lika) yerleştirilen küçük kaptı."
          },
          bugun: {
            heading: "Günümüz karşılığı",
            text: "[Yer tutucu içerik] Günümüzdeki kalem kartuşları, yazıcı mürekkep tankları ve dijital çizim yazılımlarındaki renk paletleri aynı işlevi sürdürür."
          }
        }
      },
      {
        id: "mekanik-kus",
        wallId: "duvar2",
        name: "Mekanik Kuş",
        x: 38.0,
        y: 42.0,
        image: "assets/img/nesne-mekanik-kus.webp",
        imagePlaceholderLabel: "Mekanik Kuş",
        ariaLabel: "Mekanik Kuş nesnesini incele",
        tabs: {
          donem: {
            heading: "O zaman ne işe yarardı?",
            text: "[Yer tutucu içerik] Su basıncı, hava veya küçük dişlilerle kanat çırpan ya da ses çıkaran basit otomat modelleri; hareket ilkelerini gözlemlemek için yapılırdı."
          },
          bugun: {
            heading: "Günümüz karşılığı",
            text: "[Yer tutucu içerik] Günümüzün programlanabilir robotik kitleri, servo motorlu maketleri ve otomatik ses/hareket sensörlü oyuncakları bu geleneğin devamıdır."
          }
        }
      },
      {
        id: "kukla",
        wallId: "duvar2",
        name: "Kukla",
        x: 64.0,
        y: 48.0,
        image: "assets/img/nesne-kukla.webp",
        imagePlaceholderLabel: "Eklemli Kukla",
        ariaLabel: "Kukla nesnesini incele",
        tabs: {
          donem: {
            heading: "O zaman ne işe yarardı?",
            text: "[Yer tutucu içerik] İplerle veya ahşap mafsallarla hareket ettirilen kuklalar, hem oyun aracıydı hem de insan ve hayvan eklemlerinin mekanik hareketini anlamaya yardımcı olurdu."
          },
          bugun: {
            heading: "Günümüz karşılığı",
            text: "[Yer tutucu içerik] Bugün eklemli robot kolları, animasyon karakter iskeletleri (rigging) ve hareket yakalama modelleri aynı kinematik mantığı kullanır."
          }
        }
      },
      {
        id: "oyma-takimi",
        wallId: "duvar3",
        name: "Oyma Takımı",
        x: 42.0,
        y: 62.0,
        image: "assets/img/nesne-oyma-takimi.webp",
        imagePlaceholderLabel: "Oyma Takımı",
        ariaLabel: "Oyma Takımı nesnesini incele",
        tabs: {
          donem: {
            heading: "O zaman ne işe yarardı?",
            text: "[Yer tutucu içerik] Farklı ağız genişliklerindeki iskarpela ve bıçaklardan oluşan bu takım, ahşaptan dişli çarklar, kaldıraçlar ve kapaklar şekillendirmek için kullanılırdı."
          },
          bugun: {
            heading: "Günümüz karşılığı",
            text: "[Yer tutucu içerik] Günümüzde hassas parça üretiminde kullanılan CNC frezeler, lazer kesiciler ve 3B yazıcılar benzer şekillendirme görevini üstlenir."
          }
        }
      },
      {
        id: "yazili-sayfalar",
        wallId: "duvar3",
        name: "Yazılı Sayfalar",
        x: 66.0,
        y: 54.0,
        image: "assets/img/nesne-yazili-sayfalar.webp",
        imagePlaceholderLabel: "Yazılı Sayfalar",
        ariaLabel: "Yazılı Sayfalar nesnesini incele",
        tabs: {
          donem: {
            heading: "O zaman ne işe yarardı?",
            text: "[Yer tutucu içerik] El yapımı kağıtlar üzerine alınan notlar, geometrik şekiller ve düzenek taslakları; fikirlerin denenip sonraki kuşaklara aktarılmasını sağlardı."
          },
          bugun: {
            heading: "Günümüz karşılığı",
            text: "[Yer tutucu içerik] Günümüzde mühendislik defterleri, CAD teknik çizim dosyaları ve dijital not uygulamaları tasarım belleğini oluşturur."
          }
        }
      },
      {
        id: "kucuk-pencere",
        wallId: "duvar4",
        name: "Küçük Pencere",
        x: 40.0,
        y: 34.0,
        image: "assets/img/nesne-kucuk-pencere.webp",
        imagePlaceholderLabel: "Küçük Pencere",
        ariaLabel: "Küçük Pencere nesnesini incele",
        tabs: {
          donem: {
            heading: "O zaman ne işe yarardı?",
            text: "[Yer tutucu içerik] Taş duvarlara açılan küçük pencere gündüz doğal ışık ve hava sirkülasyonu sağlarken, güneş ışığının açısı zamanı takip etmeye de yarardı."
          },
          bugun: {
            heading: "Günümüz karşılığı",
            text: "[Yer tutucu içerik] Modern binalardaki ısı yalıtımlı pencereler, doğal aydınlatma sistemleri ve akıllı havalandırma menfezleri aynı amaçla tasarlanır."
          }
        }
      },
      {
        id: "mum",
        wallId: "duvar4",
        name: "Mum",
        x: 64.0,
        y: 65.0,
        image: "assets/img/nesne-mum.webp",
        imagePlaceholderLabel: "Mum",
        ariaLabel: "Mum nesnesini incele",
        tabs: {
          donem: {
            heading: "O zaman ne işe yarardı?",
            text: "[Yer tutucu içerik] Balmumu veya içyağından yapılan mumlar akşam karanlığında çalışma odasını aydınlatır, aynı zamanda sabit yanma hızıyla basit zaman ölçümünde de kullanılırdı."
          },
          bugun: {
            heading: "Günümüz karşılığı",
            text: "[Yer tutucu içerik] Günümüzde LED masa lambaları aydınlatma görevini, dijital saat ve zamanlayıcılar ise zaman ölçümünü üstlenir."
          }
        }
      }
    ],

    // Eşleştirme etkinliği çiftleri (eski alet <-> günümüz karşılığı)
    matchingPairs: [
      {
        id: "rahle",
        oldLabel: "Rahle",
        modernLabel: "Kitap tutucu ve tablet standı"
      },
      {
        id: "kamis-kalem",
        oldLabel: "Kamış Kalem",
        modernLabel: "Teknik çizim ve dijital kalem"
      },
      {
        id: "mekanik-kus",
        oldLabel: "Mekanik Kuş",
        modernLabel: "Programlanabilir robotik maket"
      },
      {
        id: "oyma-takimi",
        oldLabel: "Oyma Takımı",
        modernLabel: "CNC kesici ve 3B yazıcı"
      },
      {
        id: "mum",
        oldLabel: "Mum",
        modernLabel: "LED çalışma lambası"
      }
    ],

    // Kapanış değerlendirmesi (yer tutucu 3 çoktan seçmeli soru)
    quizQuestions: [
      {
        id: "q1",
        question: "[Yer tutucu soru 1] Cezeri’nin çalışma köşesindeki rahle, kamış kalem ve yazılı sayfalar birlikte hangi becerinin önemini gösterir?",
        options: [
          "Tasarım yapmadan önce planlama, çizim ve kayıt tutmanın",
          "Yalnızca sözel ezbere dayalı çalışmanın",
          "Araçları hiç değiştirmeden kullanmanın",
          "Sadece gece saatlerinde çalışmanın"
        ],
        correctIndex: 0,
        explanation: "Mekanik düzenekler geliştirilmeden önce taslak çizmek ve gözlemleri yazılı olarak kaydetmek tasarım sürecinin temelidir."
      },
      {
        id: "q2",
        question: "[Yer tutucu soru 2] Eklemli kukla ve mekanik kuş gibi modeller, bugünkü hangi mühendislik alanının erken örnekleri sayılabilir?",
        options: [
          "Tarım sulama kanallarının",
          "Otomasyon ve robotik sistemlerin",
          "Tekstil dokumacılığının",
          "Kimyasal gübre üretiminin"
        ],
        correctIndex: 1,
        explanation: "Kendi kendine veya mekanik bağlantılarla hareket eden düzenekler, modern otomasyon ve robotiğin öncüleri arasında yer alır."
      },
      {
        id: "q3",
        question: "[Yer tutucu soru 3] Bu etkinlikte incelediğimiz oda hakkında aşağıdakilerden hangisi doğrudur?",
        options: [
          "Cezeri’nin çocukluk odasının birebir fotoğrafından kopyalanmıştır",
          "Cezeri’nin tüm eserleri yalnızca bu odada sergilenmektedir",
          "Kaynaklarda belgelenmediği için dönemin araçlarına dayalı tahmini bir canlandırmadır",
          "20. yüzyılda yapılmış modern bir müze odasıdır"
        ],
        correctIndex: 2,
        explanation: "Cezeri’nin çocukluk odası tarihsel kaynaklarda ayrıntılı biçimde belgelenmemiştir; sahne dönemin araçları üzerinden kurgulanmıştır."
      }
    ]
  };
})(window);
