(function (global) {
  "use strict";

  var Cezeri = global.Cezeri = global.Cezeri || {};

  /*
   * VERİ DOSYASI — 4 DUVAR, 10 NESNE
   * 4.6.2 Dijital Kaynak pedagojik içerikleri ile birebir uyumludur.
   */
  Cezeri.data = {
    title: "Bilim İnsanının Çocukluğu",
    introMission: "Merhaba sevgili öğrenciler! Bu etkinlikte bir bilim insanının çocukluğuna yolculuk yapacağız. Odanın dört duvarını gezerek merak ettiğiniz nesnelerin numaralarına tıklayıp açıklamalarını okuyunuz.",
    disclaimer: "Canlandırma: Bir bilim insanının çocukluk odası ve aletleri, dönemin bilimsel mirasına dayalı bir canlandırmadır.",

    totalObjectCount: 10,

    // 4 Duvar
    walls: [
      {
        id: "duvar1",
        order: 1,
        name: "1. Duvar: Çalışma Masası",
        shortName: "Çalışma Masası",
        image: "assets/img/duvar1.webp",
        ariaLabel: "1. Duvar: Çalışma Masası. Yazı ve teknik çizim araçlarının bulunduğu çalışma alanı."
      },
      {
        id: "duvar2",
        order: 2,
        name: "2. Duvar: Gözlem ve Astronomi Rafı",
        shortName: "Astronomi Rafı",
        image: "assets/img/duvar2.webp",
        ariaLabel: "2. Duvar: Gözlem ve Astronomi Rafı. Gökyüzü gözlem araçları ve astronomi çizimlerinin bulunduğu bölüm."
      },
      {
        id: "duvar3",
        order: 3,
        name: "3. Duvar: Mekanik Atölyesi",
        shortName: "Mekanik Atölyesi",
        image: "assets/img/duvar3.webp",
        ariaLabel: "3. Duvar: Mekanik Atölyesi. Ahşap su çarkı ve dişli düzeneklerinin geliştirildiği atölye masası."
      },
      {
        id: "duvar4",
        order: 4,
        name: "4. Duvar: Kütüphane ve Pencere",
        shortName: "Kütüphane ve Pencere",
        image: "assets/img/duvar4.webp",
        ariaLabel: "4. Duvar: Kütüphane ve Pencere. Ciltli kitaplar, parşömen tomarları ve gece Dicle nehri manzarası."
      }
    ],

    // 10 Nesne (Word belgesindeki kelimesi kelimesine açıklamalar)
    objects: [
      {
        id: "kamis-kalem",
        order: 1,
        wallId: "duvar1",
        name: "Kamış Kalem",
        x: 46.7,
        y: 62.5,
        image: "assets/img/nesne-kamis-kalem.webp",
        imagePlaceholderLabel: "Kamış Kalem",
        ariaLabel: "Kamış Kalem nesnesini incele",
        description: "Kurşun kalem ve tükenmez kalemin bulunmadığı dönemlerde ucu mürekkep hokkasına batırılarak yazı ve teknik çizim yapmak için kullanılırdı."
      },
      {
        id: "murekkep-hokkasi",
        order: 2,
        wallId: "duvar1",
        name: "Mürekkep Hokkası",
        x: 38.5,
        y: 72.6,
        image: "assets/img/nesne-murekkeplik.webp",
        imagePlaceholderLabel: "Mürekkep Hokkası",
        ariaLabel: "Mürekkep Hokkası nesnesini incele",
        description: "Tükenmez kalemler yokken kamış kalemin ucunu mürekkebe batırarak parşömene yazı yazmak ve teknik çizim yapmak için kullanılırdı."
      },
      {
        id: "parsemen",
        order: 3,
        wallId: "duvar1",
        name: "Parşömen",
        x: 43.0,
        y: 70.0,
        image: "assets/img/nesne-parsemen.webp",
        imagePlaceholderLabel: "Parşömen",
        ariaLabel: "Parşömen nesnesini incele",
        description: "Matbaa ve defterler henüz yokken planlar, gözlemler ve ders notları parşömen üzerine yazılırdı."
      },
      {
        id: "yag-kandili",
        order: 4,
        wallId: "duvar1",
        name: "Yağ Kandili",
        x: 40.3,
        y: 60.9,
        image: "assets/img/nesne-yag-kandili.webp",
        imagePlaceholderLabel: "Yağ Kandili",
        ariaLabel: "Yağ Kandili nesnesini incele",
        description: "Elektrik ve gaz lambası olmadığı dönemlerde aydınlatma amacıyla kullanırdı."
      },
      {
        id: "pirinc-usturlap",
        order: 5,
        wallId: "duvar2",
        name: "Pirinç Usturlap",
        x: 28.7,
        y: 52.7,
        image: "assets/img/nesne-usturlap.webp",
        imagePlaceholderLabel: "Pirinç Usturlap",
        ariaLabel: "Pirinç Usturlap nesnesini incele",
        description: "Teleskop, uydu ve bilgisayar yokken güneş ve yıldızların konumunu ölçerek yön ve saat hesaplamakta kullanılırdı."
      },
      {
        id: "halkali-gok-kuresi",
        order: 6,
        wallId: "duvar2",
        name: "Halkalı Gök Küresi",
        x: 44.0,
        y: 56.6,
        image: "assets/img/nesne-gok-kuresi.webp",
        imagePlaceholderLabel: "Halkalı Gök Küresi",
        ariaLabel: "Halkalı Gök Küresi nesnesini incele",
        description: "Bilgisayar simülasyonları yokken gök cisimlerinin hareketini üç boyutlu olarak inceleyip hesaplamak için kullanılırdı."
      },
      {
        id: "parsemen-tomari",
        order: 7,
        wallId: "duvar2",
        name: "Parşömen Tomarları",
        x: 62.1,
        y: 65.1,
        image: "assets/img/nesne-tomar.webp",
        imagePlaceholderLabel: "Parşömen Tomarları",
        ariaLabel: "Parşömen Tomarları nesnesini incele",
        description: "Matbaa ve genel ağ olmadığı dönemlerde el yazması çizim ve astronomi bilgilerini koruyup aktarmak için kullanılırdı."
      },
      {
        id: "ahsap-su-carki",
        order: 8,
        wallId: "duvar3",
        name: "Ahşap Su Çarkı ve Dişliler",
        x: 50.0,
        y: 52.7,
        image: "assets/img/nesne-su-carki.webp",
        imagePlaceholderLabel: "Ahşap Su Çarkı ve Dişliler",
        ariaLabel: "Ahşap Su Çarkı ve Dişliler nesnesini incele",
        description: "Elektrik motorunun olmadığı dönemde akan suyun gücüyle dönme hareketi üretip su pompalarını çalıştırmayı denemek için yapılırdı."
      },
      {
        id: "gaz-lambasi",
        order: 9,
        wallId: "duvar3",
        name: "Gaz Lambası",
        x: 50.0,
        y: 24.4,
        image: "assets/img/nesne-gaz-lambasi.webp",
        imagePlaceholderLabel: "Gaz Lambası",
        ariaLabel: "Gaz Lambası nesnesini incele",
        description: "Eskiden evlerde elektrik ve ampul olmadığı için odayı ve masayı aydınlatmak için kullanılırdı."
      },
      {
        id: "basili-kitaplar",
        order: 10,
        wallId: "duvar4",
        name: "Basılı Kitaplar",
        x: 70.9,
        y: 58.6,
        image: "assets/img/nesne-kitaplar.webp",
        imagePlaceholderLabel: "Basılı Kitaplar",
        ariaLabel: "Basılı Kitaplar nesnesini incele",
        description: "Genel ağ ve dijital kütüphaneler henüz bulunmadığı için bilgiye öğretmenler ve bu sınırlı basılı kitaplardan ulaşılırdı."
      }
    ]
  };
})(window);
