(() => {
  'use strict';
  const {rooms, posts}=window.OBLEPIHA_PREVIEW;
  const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const params=new URLSearchParams(location.search);
  // Optional local hero trials leave the default image unchanged until selection.
  const heroTrials={facade:['images/hero-facade-v1.png','Фасад гостиницы «Облепиха» — вариант обработки', '66% 50%'],evening:['images/hero-evening-v1.png','Территория «Облепихи» на закате — вариант обработки','50% 50%'],original:['../assets/hero.webp','Исходная фотография территории «Облепихи»','50% 50%']};
  const heroTrial=heroTrials[params.get('hero')];
  if(heroTrial && $('.hero-photo')) {
    $('.hero-photo').src=heroTrial[0];
    $('.hero-photo').alt=heroTrial[1];
    $('.hero-photo').style.objectPosition=heroTrial[2];
  }
  const header=$('.site-header'), menu=$('.menu-toggle'), nav=$('.main-nav');
  const updateHeader=()=>header.classList.toggle('is-scrolled',scrollY>40);
  updateHeader();addEventListener('scroll',updateHeader,{passive:true});
  function setMenu(open){header.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');}
  menu.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
  nav.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false);});
  addEventListener('resize',()=>{if(innerWidth>1000)setMenu(false);},{passive:true});
  document.addEventListener('click',e=>{if(header.classList.contains('menu-open') && !header.contains(e.target))setMenu(false);});
  $$('[data-sauna-gallery]').forEach(gallery=>{
    const photo=$('img',gallery),buttons=$$('[data-sauna-photo]',gallery);
    const photos={
      jacuzzi:['../assets/sauna-page/slide-03.webp','Джакузи и комната отдыха в сауне Облепихи'],
      steam:['../assets/sauna-page/slide-01.webp','Финская парная гостиничного комплекса Облепиха']
    };
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const selected=photos[button.dataset.saunaPhoto];
      if(!selected)return;
      photo.src=selected[0];photo.alt=selected[1];
      buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    }));
  });
  $$('[data-stay-tabs]').forEach(explorer=>{
    const tabs=$$('[role="tab"]',explorer), panels=$$('[role="tabpanel"]',explorer);
    const tablist=$('[role="tablist"]',explorer);
    const compact=matchMedia('(max-width: 800px)');
    const setOrientation=()=>tablist.setAttribute('aria-orientation',compact.matches?'horizontal':'vertical');
    setOrientation();compact.addEventListener('change',setOrientation);
    function selectTab(tab,focus=false){
      tabs.forEach(item=>{
        const selected=item===tab;
        item.setAttribute('aria-selected',String(selected));
        item.tabIndex=selected?0:-1;
      });
      panels.forEach(panel=>{panel.hidden=panel.id!==tab.getAttribute('aria-controls');});
      if(focus)tab.focus();
    }
    tabs.forEach((tab,index)=>{
      tab.addEventListener('click',()=>selectTab(tab));
      tab.addEventListener('keydown',event=>{
        const next=compact.matches?'ArrowRight':'ArrowDown',prev=compact.matches?'ArrowLeft':'ArrowUp';
        let target;
        if(event.key===next)target=(index+1)%tabs.length;
        else if(event.key===prev)target=(index-1+tabs.length)%tabs.length;
        else if(event.key==='Home')target=0;
        else if(event.key==='End')target=tabs.length-1;
        if(target!==undefined){event.preventDefault();selectTab(tabs[target],true);}
      });
    });
  });
  const dialogs=$$('dialog');
  function openDialog(dialog){dialogs.forEach(d=>{if(d.open)d.close();});setMenu(false);dialog.showModal();document.body.classList.add('modal-open');}
  dialogs.forEach(dialog=>{
    dialog.addEventListener('close',()=>{if(!dialogs.some(d=>d.open))document.body.classList.remove('modal-open');});
    $('[data-close]',dialog).addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{const b=dialog.getBoundingClientRect();if(e.target===dialog && (e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom))dialog.close();});
  });
  // Close our room details before the original TravelLine handler opens its own window.
  document.addEventListener('click',event=>{
    const bookingLink=event.target.closest('[data-tl-booking-open]');
    if(bookingLink) {
      const swipedPhoto=bookingLink.closest('[data-category-carousel]');
      if(swipedPhoto?.dataset.suppressBookingClick==='true') {
        event.preventDefault();event.stopImmediatePropagation();
        delete swipedPhoto.dataset.suppressBookingClick;
        return;
      }
      dialogs.forEach(dialog=>{if(dialog.open)dialog.close();});
      setMenu(false);
      if(bookingLink.hasAttribute('data-category-quick-booking') && window.OBLEPIHA_BOOKING?.openRoom(bookingLink.getAttribute('data-tl-room'))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      // TravelLine binds links once. Forward dynamic details to the same static room link.
      const roomProxy=bookingLink.hasAttribute('data-tl-dynamic') && document.getElementById('tl-room-'+bookingLink.getAttribute('data-tl-room'));
      if(roomProxy) {
        event.preventDefault();
        event.stopImmediatePropagation();
        roomProxy.click();
      }
    }
  },{capture:true});
  // Each carousel contains photos only from its own room category.
  $$('[data-category-carousel]').forEach(carousel=>{
    const seen=new Set();
    const photos=rooms.filter(r=>r.category===carousel.dataset.categoryCarousel).flatMap(r=>r.photos.filter(src=>{if(seen.has(src))return false;seen.add(src);return true;}).map(src=>({src,room:r})));
    if(!photos.length)return;
    carousel.addEventListener('dragstart',event=>event.preventDefault());
    const photoLink=$('.category-photo',carousel),count=$('.category-photo-count',carousel);
    let image=$('img',carousel),index=0,requestedIndex=0,direction=1,animating=false,start=null;
    const loaded=new Map([[0,Promise.resolve(image)]]);
    function loadPhoto(photoIndex){
      if(!loaded.has(photoIndex)){
        const photo=photos[photoIndex],nextImage=new Image();
        nextImage.alt=photo.room.name+' — фото '+(photoIndex+1);
        nextImage.src='../assets/'+photo.src;
        loaded.set(photoIndex,nextImage.decode().then(()=>nextImage).catch(error=>{loaded.delete(photoIndex);throw error;}));
      }
      return loaded.get(photoIndex);
    }
    function preloadNeighbours(){
      [-1,1].forEach(step=>loadPhoto((index+step+photos.length)%photos.length).catch(()=>{}));
    }
    async function showPhoto(step){
      direction=step<0?-1:1;
      requestedIndex=(requestedIndex+direction+photos.length)%photos.length;
      if(animating)return;
      animating=true;
      carousel.dataset.animating='true';
      try{
        while(index!==requestedIndex){
          const slideDirection=direction;
          const nextIndex=(index+slideDirection+photos.length)%photos.length;
          // Decode before moving so an uncached photo cannot flash or jump.
          const nextImage=await loadPhoto(nextIndex);
          photoLink.insertBefore(nextImage,count);
          const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
          if(!reduceMotion){
            const timing={duration:420,easing:'cubic-bezier(.22,.68,.25,1)',fill:'both'};
            const outgoing=image.animate([{transform:'translateX(0)'},{transform:'translateX('+(-slideDirection*100)+'%)'}],timing);
            const incoming=nextImage.animate([{transform:'translateX('+(slideDirection*100)+'%)'},{transform:'translateX(0)'}],timing);
            await Promise.all([outgoing.finished,incoming.finished]);
            image.remove();outgoing.cancel();incoming.cancel();
          }else image.remove();
          image=nextImage;index=nextIndex;
          count.textContent=(index+1)+' / '+photos.length;
          carousel.dataset.photoIndex=String(index);
          // Booking links keep the whole group; changing the photo does not narrow it.
          preloadNeighbours();
        }
      }catch(error){
        requestedIndex=index;
        console.warn('Не удалось загрузить фотографию номера',error);
      }finally{
        animating=false;
        delete carousel.dataset.animating;
      }
    }
    preloadNeighbours();
    $$('[data-category-step]',carousel).forEach(button=>{
      button.hidden=photos.length<2;
      button.addEventListener('click',()=>showPhoto(Number(button.dataset.categoryStep)));
    });
    carousel.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();showPhoto(event.key==='ArrowRight'?1:-1);
    });
    carousel.addEventListener('pointerdown',event=>{
      start=event.target.closest('button')||event.button!==0?null:{x:event.clientX,y:event.clientY};
    },{passive:true});
    carousel.addEventListener('pointercancel',()=>{start=null;},{passive:true});
    carousel.addEventListener('pointerup',event=>{
      if(!start)return;
      const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
      if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3)return;
      carousel.dataset.suppressBookingClick='true';
      showPhoto(dx<0?1:-1);
      setTimeout(()=>delete carousel.dataset.suppressBookingClick,450);
    },{passive:true});
  });
  let expanded=false, filter='all';
  function filterRooms(next=filter,showAll=expanded){
    filter=next;expanded=showAll;
    const cards=$$('[data-room-card]');
    let visible=0;
    cards.forEach(card=>{
      const matches=filter==='all'||card.dataset.guests===filter;
      card.hidden=!matches||(!expanded&&visible>=3);
      if(matches)visible++;
    });
    $$('[data-room-filter]').forEach(b=>{const active=b.dataset.roomFilter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    const more=$('#show-rooms');
    if(more){more.hidden=visible<=3;more.innerHTML=expanded?'Свернуть категории <span aria-hidden="true">↑</span>':`Все ${visible} категорий <span aria-hidden="true">↓</span>`;}
  }
  if($('#show-rooms')){
    filterRooms(params.get('guests')==='3'?'3':'all',params.has('arrival'));
    $$('[data-room-filter]').forEach(b=>b.addEventListener('click',()=>{filterRooms(b.dataset.roomFilter,true);$('#room-summary').textContent='Завтрак включён в тариф';}));
    $('#show-rooms').addEventListener('click',()=>{const collapse=expanded;filterRooms(filter,!expanded);if(collapse)$('#rooms').scrollIntoView({behavior:'smooth'});});
  }
  let activeRoom=null,roomPhoto=0;
  function renderRoomPhoto(){if(!activeRoom)return;$('#room-detail-photo').src='../assets/'+activeRoom.photos[roomPhoto];$('#room-photo-count').textContent=`${roomPhoto+1} / ${activeRoom.photos.length}`;}
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('[data-room]');if(!trigger)return;
    const room=rooms.find(r=>r.id===trigger.dataset.room);if(!room)return;
    activeRoom=room;roomPhoto=0;
    $('#room-dialog-content').innerHTML=`<article class="room-detail"><div class="room-detail-media"><img id="room-detail-photo" src="../assets/${escape(room.photos[0])}" alt="${escape(room.name)}"><div class="room-gallery-controls"><button data-room-step="-1" aria-label="Предыдущее фото">←</button><span id="room-photo-count">1 / ${room.photos.length}</span><button data-room-step="1" aria-label="Следующее фото">→</button></div></div><div class="room-detail-copy"><span class="eyebrow">ВАШЕ МЕСТО ДЛЯ ОТДЫХА</span><h2>${escape(room.name)}</h2><ul>${room.facts.map(f=>`<li>${escape(f)}</li>`).join('')}<li>${room.breakfast?'Завтрак в стандартном тарифе':'Тариф без завтрака'}</li></ul><p class="room-detail-description">${escape(room.description)}</p><p class="price">от ${room.price.toLocaleString('ru-RU')} ₽</p><p class="muted">Окончательная цена и наличие на выбранные даты — при бронировании.</p><a class="button" href="index.html#booking" data-tl-booking-open="true" data-tl-dynamic data-tl-room="${escape(room.id)}">Забронировать номер <span aria-hidden="true">↗</span></a></div></article>`;
    openDialog($('#room-dialog'));
  });
  document.addEventListener('click',e=>{const b=e.target.closest('[data-room-step]');if(b&&activeRoom){roomPhoto=(roomPhoto+Number(b.dataset.roomStep)+activeRoom.photos.length)%activeRoom.photos.length;renderRoomPhoto();}});
  let gallery=[],photoIndex=0;
  function renderPhoto(){const item=gallery[photoIndex];$('#lightbox-photo').src=item.dataset.photo;$('#lightbox-photo').alt=item.dataset.caption;$('#lightbox-caption').textContent=`${item.dataset.caption} · ${photoIndex+1} / ${gallery.length}`;}
  function stepPhoto(step){if(gallery.length){photoIndex=(photoIndex+step+gallery.length)%gallery.length;renderPhoto();}}
  document.addEventListener('click',e=>{
    const trigger=e.target.closest('[data-photo]');if(!trigger)return;
    gallery=$$('[data-photo]').filter(b=>b.dataset.gallery===trigger.dataset.gallery&&!b.hidden);
    photoIndex=gallery.indexOf(trigger);renderPhoto();openDialog($('#lightbox'));
  });
  $$('[data-photo-step]').forEach(b=>b.addEventListener('click',()=>stepPhoto(Number(b.dataset.photoStep))));
  document.addEventListener('keydown',e=>{if($('#lightbox').open){if(e.key==='ArrowRight')stepPhoto(1);if(e.key==='ArrowLeft')stepPhoto(-1);}else if($('#room-dialog').open&&activeRoom&&['ArrowRight','ArrowLeft'].includes(e.key)){roomPhoto=(roomPhoto+(e.key==='ArrowRight'?1:-1)+activeRoom.photos.length)%activeRoom.photos.length;renderRoomPhoto();}});
  $$('[data-gallery-filter]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-gallery-filter]').forEach(other=>{const active=other===b;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));});
    $$('[data-gallery-category]').forEach(photo=>photo.hidden=b.dataset.galleryFilter!=='all'&&photo.dataset.galleryCategory!==b.dataset.galleryFilter);
  }));
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-article]');if(!b)return;
    const post=posts.find(p=>p.id===b.dataset.article);if(!post)return;
    $('#article-content').innerHTML=`<img src="${escape(post.image.startsWith('images/')?post.image:'../'+post.image)}" alt="${escape(post.title)}"><span class="eyebrow">${post.kind==='promotion'?'ПРЕДЛОЖЕНИЕ ДЛЯ ГОСТЕЙ':'НОВОСТИ КОМПЛЕКСА'}</span><h2>${escape(post.title)}</h2><p>${escape(post.text)}</p>`;
    openDialog($('#article-dialog'));
  });
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.animate([{opacity:.35,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});
      observer.unobserve(entry.target);
    }),{threshold:.1});
    $$('.section-heading,.hotel-intro-layout,.category-card,.home-stay-layout,.dining-card,.home-sauna,.event-card,.service-story').forEach(el=>observer.observe(el));
  }
})();
