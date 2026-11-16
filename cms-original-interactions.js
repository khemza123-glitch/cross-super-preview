

  // ===== Shared prototype router =====
  const routeNames = ['home','about','products','product-laundry','product-softener','product-iron','product-dish','product-refresher','product-toilet','product-floor','reviews','stores','news','contact'];

  function showRoute(route, pushHash = true){
    if(!routeNames.includes(route)) route = 'about';
    document.documentElement.classList.add('route-switching');
    document.querySelectorAll('.site-page').forEach((page)=>{
      page.classList.toggle('active', page.id === 'page-' + route);
    });
    requestAnimationFrame(()=>document.documentElement.classList.remove('route-switching'));
    document.querySelectorAll('[data-route]').forEach((link)=>{
      const isProductRoute = route === 'products' || route.startsWith('product-');
      const navProduct = link.dataset.route === 'products';
      link.classList.toggle('active', link.dataset.route === route || (isProductRoute && navProduct));
    });
    document.querySelectorAll('.product-tab').forEach((tab)=>{
      tab.classList.toggle('active', tab.dataset.route === route);
    });
    if(pushHash && location.hash !== '#' + route){
      history.pushState(null,'','#' + route);
    }
    // Keep every page aligned to the same top position under the fixed nav.
    window.scrollTo({top:0,left:0,behavior:'instant'});
    setTimeout(()=>window.dispatchEvent(new Event('scroll')),20);
  }

  document.addEventListener('click',(e)=>{
    const link=e.target.closest('[data-route]');
    if(!link) return;
    e.preventDefault();
    showRoute(link.dataset.route,true);
  });

  window.addEventListener('popstate',()=>{
    showRoute((location.hash || '#home').slice(1),false);
  });

  // Home v97 uses its own supplied-video hero and multi-section layout.
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function updateHomeStory(){}

  // About V88: reuse existing page imagery in the heritage visual band without duplicating embedded assets.
  const aboutPage = document.getElementById('page-about');
  if (aboutPage) {
    const sourceImages = [...aboutPage.querySelectorAll('.milestone .media-card img:not(.video-thumb)')];
    aboutPage.querySelectorAll('.about-heritage-thumb[data-copy-from]').forEach((slot) => {
      const index = Number(slot.dataset.copyFrom || 0);
      const source = sourceImages[index];
      if (!source) return;
      const img = document.createElement('img');
      img.src = source.getAttribute('src');
      img.alt = '';
      slot.appendChild(img);
    });
  }

  const revealEls = [...document.querySelectorAll('.reveal')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(el => io.observe(el));

  showRoute((location.hash || '#home').slice(1), false);
  updateHomeStory();

  const loadInlineYouTube = (card) => {
    if (!card || card.dataset.loaded === '1') return;
    card.dataset.loaded = '1';
    const iframe = document.createElement('iframe');
    iframe.src = card.dataset.embed;
    iframe.title = 'Cross Super YouTube video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    card.replaceChildren(iframe);
  };

  document.querySelectorAll('.video-card').forEach((card) => {
    card.addEventListener('click', () => loadInlineYouTube(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        loadInlineYouTube(card);
      }
    });
  });

  // ===== Product interactions =====
  const laundryClean=document.getElementById('laundryClean');
  if(laundryClean){
    const waterLayer=laundryClean.querySelector('.shirt-water-layer');
    const cursorProduct=laundryClean.querySelector('.laundry-cursor-product');
    const shirtWrap=laundryClean.querySelector('.laundry-shirt-wrap');
    const stains=[...laundryClean.querySelectorAll('.shirt-stain')];
    let lastPoint=null;

    const spawnWater=(x,y,dx,dy)=>{
      if(!waterLayer) return;
      const cleanRect=laundryClean.getBoundingClientRect();
      const layerRect=waterLayer.getBoundingClientRect();
      const lx=x-(layerRect.left-cleanRect.left);
      const ly=y-(layerRect.top-cleanRect.top);
      const seg=document.createElement('i');
      seg.className='water-streak';
      const len=Math.max(54, Math.min(105, Math.hypot(dx,dy)*1.8));
      seg.style.width=len+'px';
      const angle=Math.atan2(dy,dx)*180/Math.PI;
      seg.style.left=(lx-20)+'px';
      seg.style.top=(ly+20)+'px';
      seg.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;
      waterLayer.appendChild(seg);
      setTimeout(()=>seg.remove(),760);

      const bubbleCount = 2 + Math.floor(Math.random() * 2);
      for(let i=0;i<bubbleCount;i++){
        const b=document.createElement('i');
        b.className='soap-bubble';
        const size=8 + Math.random()*16;
        b.style.width=size+'px';
        b.style.height=size+'px';
        b.style.left=(lx + 4 + (Math.random()*26 - 10))+'px';
        b.style.top=(ly + 14 + (Math.random()*18 - 6))+'px';
        b.style.setProperty('--bx', ((Math.random()*20)-6)+'px');
        b.style.setProperty('--by', (-18 - Math.random()*26)+'px');
        waterLayer.appendChild(b);
        setTimeout(()=>b.remove(),960);
      }
    };

    const fadeNearbyStains=(clientX,clientY)=>{
      stains.forEach(stain=>{
        const r=stain.getBoundingClientRect();
        const sx=r.left+r.width/2;
        const sy=r.top+r.height/2;
        const dist=Math.hypot(sx-clientX,sy-clientY);
        if(dist<110){
          const current=parseFloat(stain.dataset.opacity || '0.92');
          const next=Math.max(0,current-0.035);
          stain.dataset.opacity=next.toFixed(3);
          stain.style.opacity=next;
          stain.style.transform=`scale(${0.92 + next*0.09})`;
        }
      });
    };

    laundryClean.addEventListener('pointermove',(e)=>{
      const r=laundryClean.getBoundingClientRect();
      const x=e.clientX-r.left;
      const y=e.clientY-r.top;

      if(cursorProduct){
        cursorProduct.style.left=x+'px';
        cursorProduct.style.top=y+'px';
      }

      fadeNearbyStains(e.clientX,e.clientY);

      const dx=lastPoint ? x-lastPoint.x : 0;
      const dy=lastPoint ? y-lastPoint.y : 0;
      if(lastPoint && Math.hypot(dx,dy) > 3){
        spawnWater(x,y,dx,dy);
      }
      lastPoint={x,y};
    });

    laundryClean.addEventListener('pointerleave',()=>{ lastPoint=null; });
  }

  let laundryIndex=0;
  const laundryCards=[...document.querySelectorAll('#laundrySizes .size-card')];
  const updateLaundryCarousel=()=>{
    laundryCards.forEach((c,i)=>c.classList.toggle('active',i===laundryIndex));
    const active=laundryCards[laundryIndex];
    if(active) active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  };
  document.querySelectorAll('[data-carousel]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!laundryCards.length)return;
    laundryIndex=(laundryIndex+(btn.dataset.carousel==='next'?1:-1)+laundryCards.length)%laundryCards.length;
    updateLaundryCarousel();
  }));

  const softenerStage=document.getElementById('softenerStageV37');
  const softenerTouch=document.getElementById('softenerTouchV37');
  const softenerCanvas=document.getElementById('softenerCanvasV37');
  const softenerSource=document.getElementById('softenerSourceV37');
  if(softenerStage && softenerTouch && softenerCanvas && softenerSource){
    const ctx=softenerCanvas.getContext('2d',{alpha:true});
    let cssW=0,cssH=0,dpr=1,lastT=performance.now(),lastParticle=0;
    const STRIPS=54;
    const strips=Array.from({length:STRIPS},(_,i)=>({i,offX:0,offY:0,vx:0,vy:0}));
    let layout={x:0,y:0,w:0,h:0};
    let pointer={x:0,y:0,lastX:0,lastY:0,inside:false};

    function fitCanvas(){
      const r=softenerCanvas.getBoundingClientRect();
      if(r.width<10||r.height<10)return false;
      const nw=Math.round(r.width),nh=Math.round(r.height),nd=Math.min(window.devicePixelRatio||1,3);
      if(nw!==cssW||nh!==cssH||nd!==dpr){
        cssW=nw;cssH=nh;dpr=nd;
        softenerCanvas.width=Math.max(1,Math.round(cssW*dpr));
        softenerCanvas.height=Math.max(1,Math.round(cssH*dpr));
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      }
      return true;
    }
    function calcLayout(){
      if(!softenerSource.naturalWidth)return;
      const iw=softenerSource.naturalWidth,ih=softenerSource.naturalHeight;
      const s=Math.min(cssW/iw,cssH/ih)*.965;
      layout.w=iw*s;layout.h=ih*s;
      layout.x=(cssW-layout.w)*.16;layout.y=(cssH-layout.h)*.18;
    }
    function emit(clientX,clientY){
      const now=performance.now(); if(now-lastParticle<85)return; lastParticle=now;
      const r=softenerStage.getBoundingClientRect();
      const p=document.createElement('i'); p.className='softener-scent-v37 '+(Math.random()>.55?'bubble':'petal');
      p.style.left=(clientX-r.left)+'px';p.style.top=(clientY-r.top)+'px';
      p.style.setProperty('--sx',((Math.random()-.5)*90)+'px');p.style.setProperty('--sy',(-55-Math.random()*48)+'px');p.style.setProperty('--sr',((Math.random()-.5)*180)+'deg');
      softenerStage.appendChild(p);setTimeout(()=>p.remove(),1500);
    }
    function setPointer(e){
      const r=softenerCanvas.getBoundingClientRect();
      const x=Math.max(0,Math.min(r.width,e.clientX-r.left)),y=Math.max(0,Math.min(r.height,e.clientY-r.top));
      const dx=x-pointer.lastX,dy=y-pointer.lastY;
      pointer.x=x;pointer.y=y;pointer.lastX=x;pointer.lastY=y;pointer.inside=true;
      const localY=(y-layout.y)/Math.max(1,layout.h);
      strips.forEach((s,i)=>{
        const v=(i+.5)/STRIPS,dist=Math.abs(v-localY),influence=Math.exp(-(dist*dist)/.022);
        s.vx+=Math.max(-16,Math.min(16,dx))*.085*influence;
        s.vy+=Math.max(-14,Math.min(14,dy))*.060*influence;
      });
      emit(e.clientX,e.clientY);
    }
    softenerTouch.addEventListener('pointerenter',e=>{const r=softenerCanvas.getBoundingClientRect();pointer.lastX=e.clientX-r.left;pointer.lastY=e.clientY-r.top;pointer.inside=true;});
    softenerTouch.addEventListener('pointermove',setPointer);
    softenerTouch.addEventListener('pointerleave',()=>pointer.inside=false);
    window.addEventListener('resize',()=>{fitCanvas();calcLayout();},{passive:true});

    function render(now){
      requestAnimationFrame(render);
      if(!fitCanvas()||!softenerSource.complete||!softenerSource.naturalWidth)return;
      calcLayout();
      const dt=Math.min(.034,(now-lastT)/1000||.016);lastT=now;
      const step=dt*60,t=now*.001;
      strips.forEach((s,i)=>{
        const v=(i+.5)/STRIPS;
        const globalX=Math.sin(t*.52)*2.8+Math.sin(t*.23+0.8)*1.8;
        const globalY=Math.cos(t*.48+0.6)*1.9;
        const localX=Math.sin(t*1.05+v*7.4)*3.8;
        const localY=Math.cos(t*.92+v*8.8)*2.4;
        const idleX=globalX+localX;
        const idleY=globalY+localY;
        s.vx+=(idleX-s.offX)*.048*step;
        s.vy+=(idleY-s.offY)*.045*step;
        s.vx*=.91;
        s.vy*=.91;
        s.offX+=s.vx*step;
        s.offY+=s.vy*step;
        s.offX=Math.max(-18,Math.min(18,s.offX));
        s.offY=Math.max(-11,Math.min(11,s.offY));
      });
      ctx.clearRect(0,0,cssW,cssH);
      const iw=softenerSource.naturalWidth,ih=softenerSource.naturalHeight;
      const sh=ih/STRIPS,dh=layout.h/STRIPS;
      for(let i=0;i<STRIPS;i++){
        const s=strips[i],sy=i*sh,dy=layout.y+i*dh;
        ctx.drawImage(softenerSource,0,Math.max(0,sy-1.4),iw,Math.min(ih-sy+1.4,sh+2.8),layout.x+s.offX,dy+s.offY-1.15,layout.w,dh+2.3);
      }
    }
    if(softenerSource.complete){fitCanvas();calcLayout();requestAnimationFrame(render)}
    else softenerSource.addEventListener('load',()=>{fitCanvas();calcLayout();requestAnimationFrame(render)},{once:true});
  }


  const softenerLowerProductV44=document.getElementById('softenerLowerProductV44');
  if(softenerLowerProductV44){
    const sourceProduct=document.querySelector('#page-product-softener .softener-product-in-frame-v40');
    if(sourceProduct) softenerLowerProductV44.src=sourceProduct.src;
  }

  const ironSlider=document.getElementById('ironSlider');
  if(ironSlider){
    const compare=document.getElementById('ironCompare');
    const sync=()=>compare.style.setProperty('--iron-x',ironSlider.value+'%');
    ironSlider.addEventListener('input',sync);sync();
  }

  const dishZone=document.getElementById('dishZone');
  const dishPlate=document.getElementById('dishPlateWrap');
  const dishCanvas=document.getElementById('dishStainCanvas');
  const dishStainSource=document.getElementById('dishStainSource');
  const dishSponge=document.getElementById('dishSponge');
  const dishFoamLayer=document.getElementById('dishFoamLayer');
  const dishStatus=document.getElementById('dishStatus');
  const dishFoamMeter=document.getElementById('dishFoamMeter');
  const dishReset=document.getElementById('dishReset');

  if(dishZone && dishPlate && dishCanvas && dishSponge && dishFoamLayer){
    const dctx=dishCanvas.getContext('2d',{alpha:true});
    let dishDpr=Math.min(window.devicePixelRatio||1,2.5);
    let holding=false, activePointer=null, foamCharge=0, holdTimer=null, lastFoam=0, cleanScore=0;
    let spongePos={x:.72,y:.73};

    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

    function fitDishCanvas(){
      const r=dishPlate.getBoundingClientRect();
      if(r.width<10||r.height<10)return;
      dishDpr=Math.min(window.devicePixelRatio||1,2.5);
      dishCanvas.width=Math.round(r.width*dishDpr);
      dishCanvas.height=Math.round(r.height*dishDpr);
      dctx.setTransform(dishDpr,0,0,dishDpr,0,0);
      dctx.imageSmoothingEnabled=true;
      drawDishStains();
    }

    function drawDishStains(){
      const r=dishPlate.getBoundingClientRect();
      const w=r.width,h=r.height;
      dctx.clearRect(0,0,w,h);
      dctx.globalCompositeOperation='source-over';

      const drawUploadedStain=()=>{
        // Keep the real stain safely inside the inner food area of the plate.
        // Crop away the transparent margins from the uploaded stain,
        // then scale the visible stain larger so it reads clearly on the plate.
        const sx=253, sy=236, sw=812, sh=761;
        const maxW=w*.78, maxH=h*.76;
        const scale=Math.min(maxW/sw,maxH/sh);
        const dw=sw*scale, dh=sh*scale;

        const dx=(w-dw)*.50;
        const dy=(h-dh)*.51;

        dctx.save();
        dctx.globalAlpha=.98;
        dctx.drawImage(dishStainSource,sx,sy,sw,sh,dx,dy,dw,dh);
        dctx.restore();
      };

      if(dishStainSource.complete && dishStainSource.naturalWidth){
        drawUploadedStain();
      }else{
        dishStainSource.addEventListener('load',()=>{
          const rr=dishPlate.getBoundingClientRect();
          if(Math.abs(rr.width-w)<3 && Math.abs(rr.height-h)<3){
            dctx.clearRect(0,0,w,h);
            drawUploadedStain();
          }else{
            fitDishCanvas();
          }
        },{once:true});
      }

      cleanScore=0;
      foamCharge=0;
      updateDishUI();
    }

    function updateDishUI(){
      if(dishFoamMeter)dishFoamMeter.style.width=(foamCharge*100).toFixed(0)+'%';
      if(!dishStatus)return;
      if(cleanScore>78)dishStatus.textContent=window.CSCMS.value("dynamic_3fec43de893054","สะอาดแล้ว");
      else if(foamCharge>=.22)dishStatus.textContent=window.CSCMS.value("dynamic_cf76d04bd211f0","ฟองพร้อมทำความสะอาด");
      else if(holding)dishStatus.textContent=window.CSCMS.value("dynamic_20e277a83c25d3","กำลังสร้างฟอง");
      else dishStatus.textContent='';
    }

    function spawnDishFoam(x,y,amount=2){
      const zr=dishZone.getBoundingClientRect();
      const now=performance.now();
      if(now-lastFoam<38 && amount<4)return;
      lastFoam=now;
      const count=Math.max(1,Math.round(amount + foamCharge*4));
      for(let i=0;i<count;i++){
        const b=document.createElement('i');
        b.className='dish-foam';
        const size=8+Math.random()*(12+foamCharge*18);
        b.style.width=b.style.height=size+'px';
        b.style.left=(x-zr.left+(Math.random()-.5)*58)+'px';
        b.style.top=(y-zr.top+(Math.random()-.5)*42)+'px';
        b.style.setProperty('--fx',((Math.random()-.5)*44)+'px');
        b.style.setProperty('--fy',(-18-Math.random()*46)+'px');
        dishFoamLayer.appendChild(b);
        setTimeout(()=>b.remove(),2400);
      }
    }

    function eraseDishStain(clientX,clientY){
      if(foamCharge<.22)return;
      const pr=dishPlate.getBoundingClientRect();
      const x=clientX-pr.left,y=clientY-pr.top;
      if(x<0||y<0||x>pr.width||y>pr.height)return;
      const radius=28+foamCharge*34;
      dctx.save();
      dctx.globalCompositeOperation='destination-out';
      const g=dctx.createRadialGradient(x,y,radius*.18,x,y,radius);
      g.addColorStop(0,'rgba(0,0,0,.98)');
      g.addColorStop(.55,'rgba(0,0,0,.82)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      dctx.fillStyle=g;
      dctx.beginPath();
      dctx.arc(x,y,radius,0,Math.PI*2);
      dctx.fill();
      dctx.restore();
      cleanScore=clamp(cleanScore+0.7+foamCharge*1.4,0,100);
      updateDishUI();
    }

    function positionSponge(clientX,clientY){
      const zr=dishZone.getBoundingClientRect();
      const x=clamp(clientX-zr.left,48,zr.width-48);
      const y=clamp(clientY-zr.top,48,zr.height-48);
      spongePos={x:x/zr.width,y:y/zr.height};
      dishSponge.style.left=x+'px';
      dishSponge.style.top=y+'px';
    }

    function startHold(e){
      holding=true;
      activePointer=e.pointerId;
      dishSponge.classList.add('is-holding');
      dishSponge.setPointerCapture?.(e.pointerId);
      positionSponge(e.clientX,e.clientY);
      if(holdTimer)clearInterval(holdTimer);
      holdTimer=setInterval(()=>{
        if(!holding)return;
        foamCharge=clamp(foamCharge+.032,0,1);
        const sr=dishSponge.getBoundingClientRect();
        spawnDishFoam(sr.left+sr.width*.50,sr.top+sr.height*.55,3);
        updateDishUI();
      },85);
      updateDishUI();
      e.preventDefault();
    }

    function moveHold(e){
      if(!holding || e.pointerId!==activePointer)return;
      positionSponge(e.clientX,e.clientY);
      const sr=dishSponge.getBoundingClientRect();
      const cx=sr.left+sr.width*.48,cy=sr.top+sr.height*.55;
      if(foamCharge>.08)spawnDishFoam(cx,cy,foamCharge>.55?4:2);
      eraseDishStain(cx,cy);
      e.preventDefault();
    }

    function endHold(e){
      if(e && activePointer!==null && e.pointerId!==activePointer)return;
      holding=false;
      activePointer=null;
      dishSponge.classList.remove('is-holding');
      if(holdTimer){clearInterval(holdTimer);holdTimer=null}
      updateDishUI();
    }

    dishSponge.addEventListener('pointerdown',startHold);
    dishSponge.addEventListener('pointermove',moveHold);
    dishSponge.addEventListener('pointerup',endHold);
    dishSponge.addEventListener('pointercancel',endHold);
    dishSponge.addEventListener('lostpointercapture',()=>endHold());

    if(dishReset)dishReset.addEventListener('click',()=>{
      fitDishCanvas();
      const zr=dishZone.getBoundingClientRect();
      dishSponge.style.left=(zr.width*.72)+'px';
      dishSponge.style.top=(zr.height*.73)+'px';
    });

    const dishRO=new ResizeObserver(()=>fitDishCanvas());
    dishRO.observe(dishPlate);
    requestAnimationFrame(()=>fitDishCanvas());
  }

  const sprayZone=document.getElementById('sprayZone');
  const sprayBtn=document.getElementById('sprayBtn');
  const refresherMistLayer=document.getElementById('refresherMistLayer');
  const refresherScentLayer=document.getElementById('refresherScentLayer');
  const refresherStatus=document.getElementById('refresherStatus');
  let sprayTimer=null;
  let scentTimer=null;
  const emitMist=()=>{
    if(!sprayZone || !refresherMistLayer) return;
    const r=sprayZone.getBoundingClientRect();
    const sx=r.width*.94;
    const sy=r.height*.31;
    sprayZone.style.setProperty('--glow-opacity','.95');
    sprayZone.style.setProperty('--glow-x','92%');
    sprayZone.style.setProperty('--glow-y','31%');
    for(let i=0;i<9;i++){
      const m=document.createElement('i');
      m.className='mist';
      m.style.left=sx + (Math.random()*16 - 10) + 'px';
      m.style.top=sy + (Math.random()*16 - 8) + 'px';
      m.style.setProperty('--dx',(-110 - Math.random()*220) + 'px');
      m.style.setProperty('--dy',(-18 + (Math.random()-.5)*140) + 'px');
      refresherMistLayer.appendChild(m);
      setTimeout(()=>m.remove(),1200);
    }
  };
  const emitScentBurst=()=>{
    if(!sprayZone || !refresherScentLayer) return;
    const r=sprayZone.getBoundingClientRect();
    const originX=r.width*0.88;
    const originY=r.height*0.36;
    const count=5 + Math.floor(Math.random()*3);
    for(let i=0;i<count;i++){
      const p=document.createElement('i');
      p.className='scent-particle-refresher';
      p.style.left=(originX + (Math.random()*90 - 50))+'px';
      p.style.top=(originY + (Math.random()*80 - 35))+'px';
      p.style.setProperty('--dx',(-120 - Math.random()*240)+'px');
      p.style.setProperty('--dy',(-50 - Math.random()*180)+'px');
      p.style.setProperty('--dur',(4.2 + Math.random()*2.8)+'s');
      refresherScentLayer.appendChild(p);
      setTimeout(()=>p.remove(),7400);
    }
  };
  const startAmbientScent=()=>{
    clearInterval(scentTimer);
    emitScentBurst();
    scentTimer=setInterval(emitScentBurst,760);
    setTimeout(()=>{clearInterval(scentTimer);scentTimer=null;},3200);
  };
  if(sprayBtn){
    const start=()=>{
      if(sprayTimer) return;
      sprayBtn.classList.add('is-active');
      if(refresherStatus) refresherStatus.textContent=window.CSCMS.value("dynamic_8979122c13a952","กำลังฉีดละอองความหอม...");
      emitMist();
      sprayTimer=setInterval(emitMist,140);
    };
    const stop=()=>{
      if(!sprayTimer) return;
      clearInterval(sprayTimer);sprayTimer=null;
      sprayBtn.classList.remove('is-active');
      if(refresherStatus) refresherStatus.textContent=window.CSCMS.value("dynamic_45d80abdd61241","ละอองความหอมกำลังลอยต่อเบา ๆ ในห้อง");
      startAmbientScent();
      setTimeout(()=>{
        if(refresherStatus) refresherStatus.textContent='';
        sprayZone && sprayZone.style.setProperty('--glow-opacity','0');
      },3600);
    };
    sprayBtn.addEventListener('pointerdown',start);
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>sprayBtn.addEventListener(ev,stop));
  }

  const tileSlider=document.getElementById('tileSlider');
  if(tileSlider){
    const compare=document.getElementById('tileCompare');
    const sync=()=>compare.style.setProperty('--tile-x',tileSlider.value+'%');
    tileSlider.addEventListener('input',sync);sync();
  }

  const floorField=document.getElementById('floorField');
  if(floorField){
    const mop=floorField.querySelector('.mop-cursor');
    const shine=floorField.querySelector('.floor-shine');
    const polishLayer=document.createElement('div');polishLayer.className='floor-polish';floorField.appendChild(polishLayer);
    const sparkleLayer=document.createElement('div');sparkleLayer.className='floor-sparkles';floorField.appendChild(sparkleLayer);
    let lastX=0,lastY=0,lastTrail=0,lastSpark=0,clearedDust=0;
    for(let i=0;i<62;i++){
      const d=document.createElement('i');
      d.className='dust';
      d.style.left=(4+Math.random()*92)+'%';
      d.style.top=(8+Math.random()*84)+'%';
      d.dataset.cleared='0';
      floorField.appendChild(d);
    }
    const addPolish=(x,y,angle,speed)=>{
      const stroke=document.createElement('i');
      stroke.className='polish-stroke';
      stroke.style.left=x+'px';
      stroke.style.top=y+'px';
      stroke.style.setProperty('--rot',angle+'deg');
      const width=Math.max(165,Math.min(260,170+speed*1.2));
      stroke.style.width=width+'px';
      stroke.style.height=Math.max(58,Math.min(86,58+speed*.22))+'px';
      polishLayer.appendChild(stroke);
      setTimeout(()=>stroke.remove(),7200);
      while(polishLayer.childElementCount>26){polishLayer.firstElementChild?.remove();}
    };
    const addSpark=(x,y)=>{
      const spark=document.createElement('i');
      spark.className='polish-spark';
      spark.style.left=x+'px';
      spark.style.top=y+'px';
      sparkleLayer.appendChild(spark);
      setTimeout(()=>spark.remove(),1600);
    };
    floorField.addEventListener('pointermove',(e)=>{
      const r=floorField.getBoundingClientRect();
      const x=e.clientX-r.left,y=e.clientY-r.top;
      const now=performance.now();
      const dx=x-lastX,dy=y-lastY;
      const dist=Math.hypot(dx,dy);
      const angle=Math.atan2(dy,dx)*180/Math.PI;
      mop.style.left=x+'px';mop.style.top=y+'px';mop.style.opacity=1;
      shine.style.setProperty('--mx',x+'px');shine.style.setProperty('--my',y+'px');
      floorField.querySelectorAll('.dust').forEach(d=>{
        const dr=d.getBoundingClientRect();
        const ddx=(dr.left+dr.width/2)-e.clientX,ddy=(dr.top+dr.height/2)-e.clientY;
        const dustDist=Math.hypot(ddx,ddy);
        if(dustDist<125){
          d.style.transform=`translate(${-ddx*.65}px,${-ddy*.65}px) scale(.2)`;
          d.style.opacity='0';
          if(d.dataset.cleared!=='1'){d.dataset.cleared='1';clearedDust++;}
        }
      });
      const progress=Math.min(1,clearedDust/62);
      floorField.style.setProperty('--clean-progress',progress.toFixed(3));
      if(dist>12 && now-lastTrail>32){
        addPolish(x-dx*.18,y-dy*.18,Number.isFinite(angle)?angle:0,dist);
        lastTrail=now;
      }
      if((dist>16 && now-lastSpark>120) || (progress>.55 && Math.random()>.86)){
        addSpark(x+18-Math.random()*36,y+12-Math.random()*24);
        lastSpark=now;
      }
      lastX=x;lastY=y;
    });
    floorField.addEventListener('pointerleave',()=>mop.style.opacity=0);
  }


;

(function(){
  const root = document.getElementById('laundrySizeCarousel');
  if(!root) return;

  const products = [...root.querySelectorAll('.size-product')];
  const cards = [...root.querySelectorAll('.size-select-card')];
  const dots = [...root.querySelectorAll('.size-dot')];
  const nameEl = root.querySelector('#sizeName');
  const descEl = root.querySelector('#sizeDesc');

  function activate(target){
    products.forEach(item => {
      const active = item.dataset.size === target;
      item.classList.toggle('active', active);
      if(active){
        nameEl.textContent = item.dataset.name;
        descEl.textContent = item.dataset.desc;
      }
    });
    cards.forEach(btn => btn.classList.toggle('active', btn.dataset.target === target));
    dots.forEach(dot => dot.classList.toggle('active', dot.dataset.dot === target));
  }

  cards.forEach(btn => {
    btn.addEventListener('click', () => activate(btn.dataset.target));
  });
})();

;

(function(){
  const gallery = document.getElementById('laundrySizeGallery');
  const modal = document.getElementById('v25ProductModal');
  if(!gallery || !modal) return;

  const modalImg = document.getElementById('v25ModalImage');
  const modalTitle = document.getElementById('v25ModalTitle');
  const modalDesc = document.getElementById('v25ModalDesc');
  const closeBtn = document.getElementById('v25ModalClose');

  const openModal = (item) => {
    const img = item.querySelector('img');
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalTitle.textContent = item.dataset.title;
    modalDesc.textContent = item.dataset.desc;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };

  gallery.querySelectorAll('.v25-size-item').forEach(item => {
    item.addEventListener('click', () => openModal(item));
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if(e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();

;

(function(){
  const STORES=window.CSCMS.storeData([{"id":1,"name":"กิจการร้านสวัสดิการ กองเรือยุธการ","region":"ภาคตะวันออก","phone":"038-437235","address":"89 ตำบลสัตหีบ อำเภอสัตหีบ อำเภอสัตหีบ จังหวัดชลบุรี 20180","province":"ชลบุรี","district":"สัตหีบ อำเภอสัตหีบ","mapX":42.913,"mapY":52.559},{"id":2,"name":"บริษัท เฉลิมไทย ดีพาร์ทเมนท์ สโตร์ จำกัด","region":"ภาคตะวันออก","phone":"034- 278 - 185","address":"709 ถนนสุขุมวิท ตำบลมะขามหย่ง อำเภอเมืองชลบุรี จังหวัดชลบุรี 20000","province":"ชลบุรี","district":"เมืองชลบุรี","mapX":42.145,"mapY":52.951},{"id":3,"name":"บริษัท ตะวันออกค้าปลีก จำกัด","region":"ภาคตะวันออก","phone":"038-981333/038-981672-77","address":"55/1 หมู่ที่ 4 ตำบลบางตีนเป็ด อำเภอเมืองฉะเชิงเทรา จังหวัดฉะเชิงเทรา 24000","province":"ฉะเชิงเทรา","district":"เมืองฉะเชิงเทรา","mapX":45.284,"mapY":45.349},{"id":4,"name":"บริษัท เบสท์ (พัทยา) คอร์เนอร์ จำกัด","region":"ภาคตะวันออก","phone":"","address":"500/555 หมู่ที่ 5 ตำบลนาเกลือ อำเภอบางละมุง จังหวัดชลบุรี 20150","province":"ชลบุรี","district":"บางละมุง","mapX":42.632,"mapY":51.882},{"id":5,"name":"บริษัท เบสท์ แฟคตอรี่ เอาท์เล็ท จำกัด","region":"ภาคตะวันออก","phone":"","address":"629 หมู่ที่ 11 ถนนสุขาภิบาล 8 ตำบลหนองขาม อำเภอศรีราชา จังหวัดชลบุรี 20230","province":"ชลบุรี","district":"ศรีราชา","mapX":43.033,"mapY":53.159},{"id":6,"name":"บริษัท พวงทองตลาดนัดติดแอร์ จำกัด","region":"ภาคตะวันออก","phone":"081-8284114","address":"1606/17 หมู่ที่ 1 ตำบลพนมสารคาม อำเภอพนมสารคาม จังหวัดฉะเชิงเทรา","province":"ฉะเชิงเทรา","district":"พนมสารคาม","mapX":44.516,"mapY":45.74},{"id":7,"name":"บริษัท แฟมิลี่ ดีพาร์ทเม้นท์สโตร์ จำกัด","region":"ภาคตะวันออก","phone":"039 - 323 - 717","address":"86/18 ถนนมหาราช ตำบลตลาด อำเภอเมืองจันทบุรี จังหวัดจันทบุรี","province":"จันทบุรี","district":"เมืองจันทบุรี","mapX":56.138,"mapY":53.52},{"id":8,"name":"บริษัท เฟรนด์ชิพ ซุปเปอร์มาร์เก็ต จำกัด","region":"ภาคตะวันออก","phone":"","address":"20/390 หมู่ที่ 10 ถนนพัทยาใต้ ตำบลหนองปรือ อำเภอบางละมุง จังหวัดชลบุรี 20150","province":"ชลบุรี","district":"บางละมุง","mapX":41.766,"mapY":52.416},{"id":9,"name":"หจก. ยิ่งใหญ่ซุปเปอร์มาเก็ต","region":"ภาคตะวันออก","phone":"","address":"108/15 ถนนศรีรองเมือง ตำบลวัดใหม่ อำเภอเมืองจันทบุรี จังหวัดจันทบุรี","province":"จันทบุรี","district":"เมืองจันทบุรี","mapX":55.37,"mapY":53.912},{"id":10,"name":"บริษัท วัชราวรรณ (2008) จำกัด","region":"ภาคตะวันออก","phone":"","address":"136 ถนนราษฎร์อุทิศ ตำบลเชิงเนิน อำเภอเมืองระยอง จังหวัดระยอง 21000","province":"ระยอง","district":"เมืองระยอง","mapX":46.082,"mapY":52.329},{"id":11,"name":"บริษัท วรรณมาบยางพร (2022) จำกัด","region":"ภาคตะวันออก","phone":"062-6548729","address":"689 หมู่ที่ 2 ตำบลมาบยางพร อำเภอปลวกแดง จังหวัดระยอง 21140","province":"ระยอง","district":"ปลวกแดง","mapX":45.314,"mapY":52.721},{"id":12,"name":"ร้าน ศรีสุภัค บิวตี้ เซ็นเตอร์","region":"ภาคตะวันออก","phone":"099-9398251","address":"88/88 ถนนบางคล้า-แปลงยาว ตำบลบางคล้า อำเภอบางคล้า จังหวัดฉะเชิงเทรา 24110","province":"ฉะเชิงเทรา","district":"บางคล้า","mapX":45.003,"mapY":44.672},{"id":13,"name":"บริษัท เอกวรนันท์ จำกัด","region":"ภาคตะวันออก","phone":"","address":"97/8 ถนนราษฎร์บำรุง ตำบลเนินพระ อำเภอเมืองระยอง จังหวัดระยอง 21000","province":"ระยอง","district":"เมืองระยอง","mapX":45.801,"mapY":51.652},{"id":14,"name":"หสม. เอสพีมินิมาร์ท","region":"ภาคตะวันออก","phone":"081-4416202","address":"25/49-50 หมู่ที่ 1 ถนนสุขุมวิท ตำบลพลูตาหลวง อำเภอสัตหีบ จังหวัดชลบุรี 20180","province":"ชลบุรี","district":"สัตหีบ","mapX":43.313,"mapY":52.089},{"id":15,"name":"ร้าน ชายมินิมาร์ท","region":"ภาคตะวันออก","phone":"086-3174938, 037-281082","address":"409 หมู่ที่ 8 ถนนสุวรรณศร ตำบลเมืองเก่า อำเภอกบินทร์บุรี จังหวัดปราจีนบุรี 25240","province":"ปราจีนบุรี","district":"กบินทร์บุรี","mapX":48.362,"mapY":43.046},{"id":16,"name":"ร้าน ซิวดีพาร์ทเมนท์สโตร์","region":"ภาคตะวันออก","phone":"089-2561442","address":"340/1-2 หมู่ที่ 2 ตำบลประจันตคาม อำเภอประจันตคาม จ.ปราจีนบุรี 25130","province":"ปราจีนบุรี","district":"ประจันตคาม","mapX":47.595,"mapY":43.438},{"id":17,"name":"ร้าน ทรงชายซุปเปอร์มาร์เก็ต","region":"ภาคตะวันออก","phone":"037-242737","address":"48 ถนน เทศบาล 19 อำเภอเมืองสระแก้ว จังหวัดสระแก้ว 27000","province":"สระแก้ว","district":"เมืองสระแก้ว","mapX":60.865,"mapY":45.526},{"id":18,"name":"ร้าน บางปะกงสโตร์","region":"ภาคตะวันออก","phone":"0834289145","address":"205/1 หมู่ที่ 10 ตำบลบางปะกง อำเภอบางปะกง จังหวัดฉะเชิงเทรา 24130","province":"ฉะเชิงเทรา","district":"บางปะกง","mapX":45.404,"mapY":45.948},{"id":19,"name":"ร้าน บิ๊กเซลล์","region":"ภาคตะวันออก","phone":"098-8327595","address":"5/11-12 อำเภอเมือง จังหวัดปราจีนบุรี","province":"ปราจีนบุรี","district":"เมือง","mapX":48.082,"mapY":42.369},{"id":20,"name":"ร้าน วอร์มาร์ท (เจี่ยเซี่ยวฮะ)","region":"ภาคตะวันออก","phone":"064-8961719","address":"288 ม.2 ถ.ราษฎร์บำรุง ต.ประจันตคาม อ.ประจันตคาม จ.ปราจีนบุรี 25130","province":"ปราจีนบุรี","district":"ประจันตคาม","mapX":48.482,"mapY":43.646},{"id":21,"name":"สุมารี ร้านค้า","region":"ภาคตะวันออก","phone":"","address":"9/544 หมู่ที่ 6 ตำบลตะพง อำเภอเมืองระยอง จังหวัดระยอง 21000","province":"ระยอง","district":"เมืองระยอง","mapX":46.201,"mapY":52.929},{"id":22,"name":"ร้าน แสงสว่างเภสัช(ไทย)","region":"ภาคตะวันออก","phone":"037-651595","address":"239 243 ถนนปราจีนธานี ตำบลหน้าเมือง อำเภอเมือง จังหวัดปราจีนบุรี 25000","province":"ปราจีนบุรี","district":"เมือง","mapX":47.215,"mapY":42.903},{"id":23,"name":"หจก. กาดคำพลาซ่า","region":"ภาคเหนือ","phone":"","address":"17/3 ถนนผดุงม่วยต่อ ตำบลจองคำ อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน 58000","province":"แม่ฮ่องสอน","district":"เมืองแม่ฮ่องสอน","mapX":10.115,"mapY":8.539},{"id":24,"name":"บริษัท เจ้เข่ง จำกัด","region":"ภาคเหนือ","phone":"","address":"700 หมู่ที่ 1 ตำบลเมืองพาน อำเภอพาน จังหวัดเชียงราย 57120","province":"เชียงราย","district":"พาน","mapX":31.037,"mapY":4.559},{"id":25,"name":"หจก. เจเจเอช 2017","region":"ภาคเหนือ","phone":"","address":"310/11,310/12 ถนนวงษ์โต ตำบลบ้านกล้วย อำเภอเมืองชัยนาท จังหวัดชัยนาท 17000","province":"ชัยนาท","district":"เมืองชัยนาท","mapX":33.045,"mapY":35.112},{"id":26,"name":"บริษัท แจ่มฟ้า เซฟมาร์ท จำกัด","region":"ภาคเหนือ","phone":"","address":"166/1 ถนนอินทยงยศ ตำบลในเมือง อำเภอเมืองลำพูน จังหวัดลำพูน 51000","province":"ลำพูน","district":"เมืองลำพูน","mapX":20.936,"mapY":13.572},{"id":27,"name":"บริษัท ชัยพงษ์พลาซ่า จำกัด","region":"ภาคเหนือ","phone":"056 611 302","address":"10/25 ถนนศรีมาลา ตำบลในเมือง อำเภอเมืองพิจิตร จังหวัดพิจิตร 66000","province":"พิจิตร","district":"เมืองพิจิตร","mapX":37.722,"mapY":28.803},{"id":28,"name":"หจก. ชิตพาณิชย์พะเยา (สมศักดิ์)","region":"ภาคเหนือ","phone":"","address":"16/1 ถนนราชสัมพันธ์ ตำบลเวียง อำเภอเมืองพะเยา จังหวัดพะเยา 56000","province":"พะเยา","district":"เมืองพะเยา","mapX":31.393,"mapY":9.395},{"id":29,"name":"บริษัท ชุติมา คอนเนค จำกัด","region":"ภาคเหนือ","phone":"088-956036","address":"88/4 ถนนมหาดไทยบำรุง ตำบลระแหง อำเภอเมืองตาก จังหวัดตาก 63000","province":"ตาก","district":"เมืองตาก","mapX":23.138,"mapY":24.592},{"id":30,"name":"หจก. ไทยเสรี มาร์เก็ตติ้ง กรุ๊ป","region":"ภาคเหนือ","phone":"","address":"11/6 ตำบลจองคำ อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน 58000","province":"แม่ฮ่องสอน","district":"เมืองแม่ฮ่องสอน","mapX":9.348,"mapY":8.931},{"id":31,"name":"บริษัท ท้อปเซ็นเตอร์ จำกัด","region":"ภาคเหนือ","phone":"","address":"80/1 ถนนราษฎร์อุทิศ ตำบลในเวียง อำเภอเมืองแพร่ จังหวัดแพร่ 54000","province":"แพร่","district":"เมืองแพร่","mapX":34.52,"mapY":16.184},{"id":32,"name":"บริษัท ท็อปแลนด์อาเขต จำกัด","region":"ภาคเหนือ","phone":"055-241-211","address":"83/9 ถนนบรมไตรโลกนารถ ตำบลในเมือง อำเภอเมืองพิษณุโลก จังหวัดพิษณุโลก 65000","province":"พิษณุโลก","district":"เมืองพิษณุโลก","mapX":35.393,"mapY":25.072},{"id":33,"name":"หจก. ไทยเสรี มาร์เก็ตติ้ง กรุ๊ป","region":"ภาคเหนือ","phone":"","address":"11/6 ตำบลจองคำ อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน 58000","province":"แม่ฮ่องสอน","district":"เมืองแม่ฮ่องสอน","mapX":9.835,"mapY":7.863},{"id":34,"name":"หจก. นราพาณิชย์","region":"ภาคเหนือ","phone":"","address":"8 ถนนอนันตวรฤทธิเดช ตำบลในเวียง อำเภอเมืองน่าน จังหวัดน่าน 55000","province":"น่าน","district":"เมืองน่าน","mapX":41.756,"mapY":11.888},{"id":35,"name":"บริษัท นราไฮเปอร์มาร์ท จำกัด","region":"ภาคเหนือ","phone":"","address":"155 ถนนสุมนเทวราช ตำบลในเวียง อำเภอเมืองน่าน จังหวัดน่าน 55000","province":"น่าน","district":"เมืองน่าน","mapX":40.988,"mapY":12.28},{"id":36,"name":"บริษัท พีบี เจริญรุ่งเรืองเทรดดิ้ง จำกัด","region":"ภาคเหนือ","phone":"056-702734","address":"333/19 ถนนวจี ตำบลหล่มสัก อำเภอหล่มสัก จังหวัดเพชรบูรณ์ 67110","province":"เพชรบูรณ์","district":"หล่มสัก","mapX":46.506,"mapY":24.743},{"id":37,"name":"บริษัท ลำปางเสรีกรุ๊ป จำกัด","region":"ภาคเหนือ","phone":"","address":"989/1-5 ถนนเจริญเมือง ตำบลสวนดอก อำเภอเมืองลำปาง จังหวัดลำปาง 52100","province":"ลำปาง","district":"เมืองลำปาง","mapX":32.879,"mapY":12.158},{"id":38,"name":"บริษัท วิถีเทพสรรพสินค้า จำกัด","region":"ภาคเหนือ","phone":"","address":"159,159/1 ถนนสวรรค์วิถี ตำบลปากน้ำโพ อำเภอเมืองนครสวรรค์ จังหวัดนครสวรรค์ 60000","province":"นครสวรรค์","district":"เมืองนครสวรรค์","mapX":36.464,"mapY":30.947},{"id":39,"name":"บริษัท วิน คอสเมติคส์ จำกัด","region":"ภาคเหนือ","phone":"081-7968883 บ/ช และ 053-325425 โกดัง","address":"99,101,103,105 ถนนข่วงเมรุ ตำบลช้างม่อย อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50300","province":"เชียงใหม่","district":"เมืองเชียงใหม่","mapX":21.52,"mapY":11.941},{"id":40,"name":"ร้าน สินไพศาล","region":"ภาคเหนือ","phone":"053-711-582","address":"526/15-7 หมู่ 2 ถนนบรรพปราการ ตำบลเวียง อำเภอเมืองเชียงราย จังหวัดเชียงราย 57000","province":"เชียงราย","district":"เมืองเชียงราย","mapX":30.269,"mapY":4.951},{"id":41,"name":"บริษัท สปริงแลนด์ ซุปเปอร์มาร์เก็ต จำกัด","region":"ภาคเหนือ","phone":"","address":"1/106-108 ถนนจิตรเพลิน ตำบลท่าอิฐ อำเภอเมืองอุตรดิตถ์ จังหวัอุตรดิตถ์ 53000","province":"อุตรดิตถ์","district":"เมืองอุตรดิตถ์ จังหวัอุตรดิตถ์","mapX":33.022,"mapY":19.395},{"id":42,"name":"ร้าน สหกรณ์โรงพยาบาลลําปาง จํากัด","region":"ภาคเหนือ","phone":"","address":"280 ถนนพหลโยธิน ตำบลหัวเวียง อำเภอเมืองลำปาง จังหวัดลำปาง 52000","province":"ลำปาง","district":"เมืองลำปาง","mapX":32.112,"mapY":12.55},{"id":43,"name":"บริษัท แสงไทยแพร่ จำกัด","region":"ภาคเหนือ","phone":"","address":"416 หมู่ที่ 9 ตำบลนาจักร อำเภอเมืองแพร่ จังหวัดแพร่ 54000","province":"แพร่","district":"เมืองแพร่","mapX":33.752,"mapY":16.576},{"id":44,"name":"หจก. สุโขทัยสุขเกษม","region":"ภาคเหนือ","phone":"055-614558, 062-5899164","address":"328/30 หมู่ที่ 9 ตำบลปากแคว อำเภอเมืองสุโขทัย จังหวัดสุโขทัย 64000","province":"สุโขทัย","district":"เมืองสุโขทัย","mapX":30.924,"mapY":23.605},{"id":45,"name":"บริษัท ส.ทวีกิจ (บิ๊กวัน) จำกัด","region":"ภาคเหนือ","phone":"","address":"ข1-287/48 ถนนนครนายก-สาริกา ตำบลนครนายก อำเภอเมืองนครนายก จังหวัดนครนายก 26000","province":"นครนายก","district":"เมืองนครนายก","mapX":46.281,"mapY":42.079},{"id":46,"name":"บริษัท ส.ล.แลนด์ จำกัด","region":"ภาคเหนือ","phone":"056883140-41","address":"999/394 หมู่ที่ 8 ตำบลวัดไทรย์ อำเภอเมืองนครสวรรค์ จังหวัดนครสวรรค์ 60000","province":"นครสวรรค์","district":"เมืองนครสวรรค์","mapX":35.696,"mapY":31.339},{"id":47,"name":"ร้าน เอื้องฟ้าเทรดดิ้ง","region":"ภาคเหนือ","phone":"","address":"ตลาดวโรรส อำเภอเมือง จ.เชียงใหม่ 50000","province":"เชียงใหม่","district":"เมือง","mapX":20.752,"mapY":12.333},{"id":48,"name":"หสม. เอื้องฟ้า","region":"ภาคเหนือ","phone":"053-235454,053-2322143","address":"114-116-118 ถนนข่วงเมรุ ตำบลช้างม่อย อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50300","province":"เชียงใหม่","district":"เมืองเชียงใหม่","mapX":21.239,"mapY":11.264},{"id":49,"name":"บริษัท เอสแอนด์เคเทรดเซ็นเตอร์ จำกัด","region":"ภาคเหนือ","phone":"","address":"141 ถนนชมฐีระเวช ตำบลตะพานหิน อำเภอตะพานหิน จังหวัดพิจิตร 66110","province":"พิจิตร","district":"ตะพานหิน","mapX":36.954,"mapY":29.194},{"id":50,"name":"บริษัท เอ็มเอ็ม สุโขทัย เอ็นเตอร์ไพร้ส จำกัด","region":"ภาคเหนือ","phone":"","address":"29-30 หมู่ที่ 1 ตำบลคลองตาล อำเภอศรีสำโรง จังหวัดสุโขทัย 64120 -","province":"สุโขทัย","district":"ศรีสำโรง","mapX":30.157,"mapY":23.997},{"id":51,"name":"ร้าน จีระพันธ์","region":"ภาคเหนือ","phone":"053-451181,086-9108047","address":"79 หมู่ที่ 4 ตำบลเวียง อำเภอฝาง จังหวัดเชียงใหม่ 50110","province":"เชียงใหม่","district":"ฝาง","mapX":21.64,"mapY":12.541},{"id":52,"name":"ร้าน จูรีภัณฑ์","region":"ภาคเหนือ","phone":"093 265 6554","address":"164 ถนน อินทยงยศ ตำบลในเมือง อำเภอเมืองลำพูน จังหวัดลำพูน 51000","province":"ลำพูน","district":"เมืองลำพูน","mapX":20.168,"mapY":13.964},{"id":53,"name":"หจก. จีนงามพานิช","region":"ภาคเหนือ","phone":"055-511363,088-2935115","address":"88,90 ถนนจอมพล ตำบลหนองหลวง อำเภอเมืองตาก จังหวัดตาก 63000","province":"ตาก","district":"เมืองตาก","mapX":22.37,"mapY":24.984},{"id":54,"name":"ร้าน ซึ่อตรงวนิช","region":"ภาคเหนือ","phone":"055 511 312","address":"16/6-7 ถนนมหาดไทยบำรุง ตำบลหนองหลวง อำเภอเมืองตาก จังหวัดตาก 63000","province":"ตาก","district":"เมืองตาก","mapX":22.857,"mapY":23.915},{"id":55,"name":"ร้าน บุญทวี(ในตลาดเทศบาล)","region":"ภาคเหนือ","phone":"","address":"7-10-68 อาคาร10 อำเภอเมือง จังหวัดเชียงราย 57000","province":"เชียงราย","district":"เมือง","mapX":30.756,"mapY":3.882},{"id":56,"name":"ร้าน บรรยงค์การค้า","region":"ภาคเหนือ","phone":"061-3122614","address":"11/14 ถนน นิเวศพิศาล อำเภอเมืองแม่ฮ่องสอน จังหวัดแม่ฮ่องสอน 58000","province":"แม่ฮ่องสอน","district":"เมืองแม่ฮ่องสอน","mapX":10.235,"mapY":9.139},{"id":57,"name":"ร้าน รุ่งเรืองสโตร์","region":"ภาคเหนือ","phone":"087 789 2526","address":"44 ถนนสุรนารายณ์ ตำบลลำนารายณ์ อำเภอชัยบาดาล จังหวัดลพบุรี 15130","province":"ลพบุรี","district":"ชัยบาดาล","mapX":39.789,"mapY":38.145},{"id":58,"name":"ร้าน เลี้ยงซุปเปอร์สโตร์","region":"ภาคเหนือ","phone":"","address":"77 ถนน รอบเมืองใน ตำบล ในเมือง อำเภอเมืองลำพูน จังหวัดลำพูน 51000","province":"ลำพูน","district":"เมืองลำพูน","mapX":20.655,"mapY":12.896},{"id":59,"name":"ร้าน เอื้องฟ้าเทรดดิ้ง","region":"ภาคเหนือ","phone":"","address":"ตลาดวโรรส อำเภอเมือง จ.เชียงใหม่ 50000","province":"เชียงใหม่","district":"เมือง","mapX":20.372,"mapY":11.798},{"id":60,"name":"บริษัท เอสแอนด์เคเทรดเซ็นเตอร์ จำกัด","region":"ภาคเหนือ","phone":"","address":"141 ถนนชมฐีระเวช ตำบลตะพานหิน อำเภอตะพานหิน จังหวัดพิจิตร 66110","province":"พิจิตร","district":"ตะพานหิน","mapX":37.441,"mapY":28.126},{"id":61,"name":"บริษัท กู๊ดส์ สโตร์ จำกัด","region":"ภาคใต้","phone":"","address":"5/61 ถนนหมู่บ้านอวยชัย ตำบลขันเงิน อำเภอหลังสวน จังหวัดชุมพร 86110","province":"ชุมพร","district":"หลังสวน","mapX":26.216,"mapY":66.717},{"id":62,"name":"บริษัท เค.ซี. (โก้ฉุ้น) ซุปเปอร์มาร์ท จำกัด","region":"ภาคใต้","phone":"","address":"156/43 หมู่ที่ 4 ตำบลท้ายเหมือง อำเภอท้ายเหมือง จังกวัดพังงา 82120","province":"พังงา","district":"ท้ายเหมือง จังกวัดพังงา","mapX":9.34,"mapY":73.645},{"id":63,"name":"บริษัท โฆษิต สโตร์ จำกัด","region":"ภาคใต้","phone":"081-9422332","address":"57/12 ถนนชมสินธุ์ ตำบลหัวหิน อำเภอหัวหิน จังหวัดประจวบคีรีขันธ์ 77110","province":"ประจวบคีรีขันธ์","district":"หัวหิน","mapX":30.497,"mapY":57.862},{"id":64,"name":"หสม. เจ เจ ทวดทอง","region":"ภาคใต้","phone":"083-2615362,081-3549488","address":"487 ถนนกะโรม ตำบลโพธิ์เสด็จ อำเภอเมืองนครศรีธรรมราช จังหวัดนครศรีธรรมราช 80000","province":"นครศรีธรรมราช","district":"เมืองนครศรีธรรมราช","mapX":30.056,"mapY":74.184},{"id":65,"name":"บริษัท ชุมพรโอเชี่ยนกรุ๊ป จำกัด","region":"ภาคใต้","phone":"","address":"188/111 ถนนศาลาแดง ตำบลท่าตะเภา อำเภอเมืองชุมพร จังหวัดชุมพร 86000","province":"ชุมพร","district":"เมืองชุมพร","mapX":25.449,"mapY":67.109},{"id":66,"name":"หจก. ไชยชนะ ซุปเปอร์สโตร์","region":"ภาคใต้","phone":"080-3699646","address":"อำเภอทุ่งตะโก จังหวัดชุมพร 86220","province":"ชุมพร","district":"ทุ่งตะโก","mapX":25.936,"mapY":66.04},{"id":67,"name":"ร้าน ณรงค์เครื่องครัว 2","region":"ภาคใต้","phone":"081-3280828","address":"1 ซอยสันติโชติ ถนนระแงะมรรคา ตำบลบางนาค อำเภอเมืองนราธิวาส จังหวัดนราธิวาส 96000","province":"นราธิวาส","district":"เมืองนราธิวาส","mapX":53.034,"mapY":93.263},{"id":68,"name":"บริษัท ตองหนึ่งรวมภัณฑ์ จำกัด","region":"ภาคใต้","phone":"085-5959532","address":"74/20 ถนนนาใน ตำบลป่าตอง อำเภอกะทู้ จังหวัดภูเก็ต 83150","province":"ภูเก็ต","district":"กะทู้","mapX":15.565,"mapY":83.395},{"id":69,"name":"หจก. ถาวรธุรกิจ","region":"ภาคใต้","phone":"","address":"2 หมู่ที่ 1 ถนนเพชรเกษม ตำบลกะเปอร์ อำเภอกะเปอร์ จังหวัดระนอง 85120","province":"ระนอง","district":"กะเปอร์","mapX":14.857,"mapY":73.678},{"id":70,"name":"หจก. ถุงเก็บทรัพย์","region":"ภาคใต้","phone":"082-2414964, 082-2515256","address":"13/5 หมู่ที่ 5 ตำบลบางสะพาน อำเภอบางสะพานน้อย จังหวัดประจวบคีรีขันธ์ 77170","province":"ประจวบคีรีขันธ์","district":"บางสะพานน้อย","mapX":29.73,"mapY":58.254},{"id":71,"name":"บริษัท ทีซีเอฟ กรู๊ป (ประเทศไทย) จำกัด","region":"ภาคใต้","phone":"","address":"55/6 หมู่ที่ 1 ตำบลบางกุ้ง อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี 84000","province":"สุราษฎร์ธานี","district":"เมืองสุราษฎร์ธานี","mapX":29.273,"mapY":71.658},{"id":72,"name":"หจก. บีแอนด์บีซุปเปอร์มาร์เก็ต","region":"ภาคใต้","phone":"","address":"91/32-36 หมู่ที่1 ตำบลปากน้ำ อำงระนอง จังหวัดระนอง 85000","province":"ระนอง","district":"","mapX":14.089,"mapY":74.069},{"id":73,"name":"ร้าน พินมินิมาร์ท","region":"ภาคใต้","phone":"081-8949180","address":"210 หมู่ที่ 1 ตำบลกะแดะ อำเภอกาญจนดิษฐ์ จังหวัดสุราษฎร์ธานี 84160","province":"สุราษฎร์ธานี","district":"กาญจนดิษฐ์","mapX":28.505,"mapY":72.05},{"id":74,"name":"บริษัท ภูเก็ตชอปปิ้งเซ็นเตอร์ จำกัด","region":"ภาคใต้","phone":"","address":"62/9-20 ถนนรัษฎา ตำบลตลาดใหญ่ อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83000","province":"ภูเก็ต","district":"เมืองภูเก็ต","mapX":14.797,"mapY":83.787},{"id":75,"name":"บริษัท ภูเก็ตเจริญพร้อมภัณฑ์ จำกัด","region":"ภาคใต้","phone":"076-355354,087-2831539","address":"69/1 หมู่ที่ 4 ถนนเจ้าฟ้า ตำบลวิชิต อำเภอเมืองภูเก็ต จังหวัดภูเก็ต 83000","province":"ภูเก็ต","district":"เมืองภูเก็ต","mapX":15.284,"mapY":82.718},{"id":76,"name":"บริษัท มาลี ซูเปอร์สโตร์ จำกัด","region":"ภาคใต้","phone":"090-5416565,098-9259292","address":"160/24 หมู่ที่ 1 ตำบลเขาน้อย อำเภอปราณบุรี จังหวัดประจวบคีรีขันธ์ 77120","province":"ประจวบคีรีขันธ์","district":"ปราณบุรี","mapX":30.217,"mapY":57.185},{"id":77,"name":"หจก. รักไทยซุปเปอร์มาร์เก็ต","region":"ภาคใต้","phone":"081-8393414","address":"60/3,60/4-5,60/6,60/7 ถนนคูหาสวรรค์ ตำบลคูหาสวรรค์ อำเภอเมืองพัทลุง จังหวัดพัทลุง 93000","province":"พัทลุง","district":"เมืองพัทลุง","mapX":33.146,"mapY":85.599},{"id":78,"name":"หจก. วรรณาปราณี","region":"ภาคใต้","phone":"","address":"1/239 ซอยหมู่บ้านเขาน้อย ตำบลหัวหิน อำเภอหัวหิน จังหวัดประจวบคีรีขันธ์ 77110","province":"ประจวบคีรีขันธ์","district":"หัวหิน","mapX":30.617,"mapY":58.462},{"id":79,"name":"ร้าน ศรีเมืองมินิมาร์ท","region":"ภาคใต้","phone":"076-421845","address":"23 ถนนเสนาราษฏร์ ตำบลตะกั่วป่า อำเภอตะกั่วป่า จังหวัดพังงา 82110","province":"พังงา","district":"ตะกั่วป่า","mapX":8.572,"mapY":74.037},{"id":80,"name":"บริษัท ศิลป์ฟ้า ซูเปอร์สโตร์ จำกัด","region":"ภาคใต้","phone":"","address":"21/4-25 ถนนภูวนารถดำเนิน ตำบลท่าตะเภา อำเภอเมืองชุมพร จังหวัดชุมพร 86000","province":"ชุมพร","district":"เมืองชุมพร","mapX":26.336,"mapY":67.317},{"id":81,"name":"บริษัท สิริบรรณช้อปปิ้งเซ็นเตอร์ จำกัด","region":"ภาคใต้","phone":"","address":"42 ถนนเจิมปัญญา ตำบลทับเที่ยง อำเภอเมืองตรัง จังหวัดตรัง 92000","province":"ตรัง","district":"เมืองตรัง","mapX":26.733,"mapY":89.257},{"id":82,"name":"บริษัท แสงเสียงหวน จำกัด","region":"ภาคใต้","phone":"","address":"2/3-2/9 ถนนนครใน ตำบลบ่อยาง อำเภอเมืองสงขลา จังหวัดสงขลา 90000","province":"สงขลา","district":"เมืองสงขลา","mapX":36.924,"mapY":85.783},{"id":83,"name":"บริษัท สุราษฎร์ธานี ดีเวลลอปเม้นท์ จำกัด","region":"ภาคใต้","phone":"","address":"528/1 ถนนตลาดใหม่ ตำบลตลาด อำเภอเมืองสุราษฎร์ธานี จังหวัดสุราษฎร์ธานี 84000","province":"สุราษฎร์ธานี","district":"เมืองสุราษฎร์ธานี","mapX":28.992,"mapY":70.981},{"id":84,"name":"ร้าน สหกรณ์ชุมพร จำกัด","region":"ภาคใต้","phone":"","address":"249/2-5 ถนนปรมินทรมรรคา ตำบลท่าตะเภา อำเภอเมืองชุมพร จังหวัดชุมพร 86000","province":"ชุมพร","district":"เมืองชุมพร","mapX":25.069,"mapY":66.574},{"id":85,"name":"ร้าน ส.สำเพ็ง สะเดา","region":"ภาคใต้","phone":"080-7078868","address":"37/5 ถนนกาญจนวณิชย์ ตำบลสะเดา อำเภอสะเดา จังหวัดสงขลา 90120","province":"สงขลา","district":"สะเดา","mapX":36.157,"mapY":86.175},{"id":86,"name":"หจก. สำเพ็งหาดใหญ่","region":"ภาคใต้","phone":"081-9571520, 087-5992222","address":"452 หมู่ที่ 1 ถนนเลี่ยงเมือง (สายเอเซีย) ตำบลควนลัง อำเภอหาดใหญ่ จังหวัดสงขลา 90110","province":"สงขลา","district":"หาดใหญ่","mapX":36.644,"mapY":85.106},{"id":87,"name":"บริษัท สำเพ็งหัวหิน จำกัด","region":"ภาคใต้","phone":"081-9338964 เจ๊นุช","address":"83 หมู่ที่ 15 ตำบลหินเหล็กไฟ อำเภอหัวหิน จังหวัดประจวบคีรีขันธ์ 77110","province":"ประจวบคีรีขันธ์","district":"หัวหิน","mapX":29.35,"mapY":57.719},{"id":88,"name":"บริษัท ส.ตรีมิตร จำกัด","region":"ภาคใต้","phone":"090-2126818, 075-251198","address":"58 ถนนสถลสถานพิทักษ์ ตำบลกันตัง อำเภอกันตัง จังหวัดตรัง 92110","province":"ตรัง","district":"กันตัง","mapX":25.966,"mapY":89.648},{"id":89,"name":"บริษัท สำเพ็งหัวหิน จำกัด","region":"ภาคใต้","phone":"061-5761025 คุณหมู","address":"180/83 ถนนชมสินธุ์ ตำบลหัวหิน อำเภอหัวหิน อำเภอหัวหิน จังหวัดประจวบคีรีขันธ์ 77110","province":"ประจวบคีรีขันธ์","district":"หัวหิน อำเภอหัวหิน","mapX":30.897,"mapY":57.391},{"id":90,"name":"บริษัท โอเดียนเซาท์เทิร์นเซ็นเตอร์ จำกัด","region":"ภาคใต้","phone":"","address":"79/7 ถนนธรรมนูญวิถี ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา 90110","province":"สงขลา","district":"หาดใหญ่","mapX":37.044,"mapY":86.383},{"id":91,"name":"นางสาว อรอุมา เกลี้ยงจุ้ย","region":"ภาคใต้","phone":"090-9926552","address":"22/40 หมู่ที่ 2 ตำบลบางนอน อำเภอเมืองระนอง จังหวัดระนอง 85000","province":"ระนอง","district":"เมืองระนอง","mapX":14.576,"mapY":73.001},{"id":92,"name":"ร้าน แอว เอส สโตร์","region":"ภาคใต้","phone":"090-9926552","address":"42/2 ถนนสุริยะประดิษฐ์ ตำบลบางนาค อำเภอเมืองนราธิวาส จังหวัดนราธิวาส 96000 130/3 ม.6 ต.ศรีสุนทร อ.ถลาง จ.ภูเก็ต 83110 152/6 หมู่ 11 ถ.สุขาภิบาล ต.ทับสะแก อ.ทับสะแก จังหวัดประจวบคีรีขันธ์ 77130 หมู่ที่ 3 ซอย 2 ถนนพ่ขุนทะเล ตำบลมะขามเตี้ย อำเภอเมือง จังหวัดสุราษฎร์ธานี เลขที่6 หมู่ที่3 ตำบลคลองไทร อำเภอท่าอ่าง จังหวัดสุราษฎร์ธานี 84100 1 ถนนต้นจันทร์ ตำบลท่าราบ อำเภอเมืองเพชรบุรี จังหวัดเพชรบุรี 76000 69 1 ตำบลกำพวน อำเภอ สุขสำราญ จังหวัดระนอง 85120 22/40 หมู่ที่ 2 ต.บางนอน อ.เมือง จ.ระนอง 85000","province":"ประจวบคีรีขันธ์","district":"เมืองนราธิวาส","mapX":29.916,"mapY":58.758},{"id":93,"name":"ร้าน เกมส์ไดเร็คเซลล์","region":"ภาคอีสาน","phone":"","address":"42/16-17 ถนนพิทักษษพนมเขต ตำบลมุกดาหาร อำเภอเมืองมุกดาหาร จังหวัดมุกดาหาร 49000","province":"มุกดาหาร","district":"ตำบลมุกดาหาร อำเภอเมืองมุกดาหาร","mapX":86.003,"mapY":26.776},{"id":94,"name":"หจก. โคราชง่วนเจ็งหลง","region":"ภาคอีสาน","phone":"02-8891271","address":"84,86 ถนนจอมพล ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000","province":"นครราชสีมา","district":"เมืองนครราชสีมา","mapX":53.722,"mapY":37.441},{"id":95,"name":"หจก. เจสโตร์","region":"ภาคอีสาน","phone":"","address":"184 หมู่ที่ 4 ตำบลแก้งไก่ อำเภอสังคม จังหวัดหนองคาย 43160","province":"หนองคาย","district":"สังคม","mapX":63.947,"mapY":17.829},{"id":96,"name":"หจก. เจน ซุปเปอร์มาร์เก็ต","region":"ภาคอีสาน","phone":"080-1991644","address":"251-252 หมู่ที่ 1 ถนนเจนจบทิศ ตำบลในเมือง อำเภอบ้านไผ่ จังหวัดขอนแก่น 40110","province":"ขอนแก่น","district":"บ้านไผ่","mapX":63.52,"mapY":30.033},{"id":97,"name":"หจก. 7 ก้าว","region":"ภาคอีสาน","phone":"044-275-6878","address":"175/1 ถนนพิบูลละเอียด ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000","province":"นครราชสีมา","district":"เมืองนครราชสีมา","mapX":52.954,"mapY":37.833},{"id":98,"name":"ร้าน จำเป็นพาณิชย์","region":"ภาคอีสาน","phone":"044-411-204","address":"169-171 ถนนชุมค้า ตำบลสีคิ้ว อำเภอสีคิ้ว จังหวัดนครราชสีมา 30140","province":"นครราชสีมา","district":"สีคิ้ว","mapX":53.441,"mapY":36.764},{"id":99,"name":"นาย เธียรชาติ รัตนบรรณกิจ (ร้านชีวิตจิตใจ)","region":"ภาคอีสาน","phone":"086-4671572,0866538752","address":"176,178 ถนนพลแสน ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000","province":"นครราชสีมา","district":"เมืองนครราชสีมา","mapX":53.842,"mapY":38.041},{"id":100,"name":"บริษัท ซุ่นเฮงพลาซ่า จำกัด","region":"ภาคอีสาน","phone":"08/19768377จัดซื้อ /บช.0815476645/045620531","address":"981 ถนนกวงเฮง ตำบลเมืองใต้ อำเภอเมืองศรีสะเกษ จังหวัดศรีสะเกษ 33000","province":"ศรีสะเกษ","district":"เมืองศรีสะเกษ","mapX":80.913,"mapY":39.02},{"id":101,"name":"บริษัท เซ็นโทซ่า จำกัด","region":"ภาคอีสาน","phone":"043-222-572","address":"62/53-57,66,81-88 ถนนกลางเมือง ตำบลในเมือง อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000","province":"ขอนแก่น","district":"เมืองขอนแก่น","mapX":62.752,"mapY":30.425},{"id":102,"name":"ร้าน ดาวมินิมาร์ท","region":"ภาคอีสาน","phone":"044 671 417","address":"89/1 หมู่ที่ 2 ตำบลประโคนชัย อำเภอประโคนชัย จังหวัดบุรีรัมย์ 31140","province":"บุรีรัมย์","district":"ประโคนชัย","mapX":67.801,"mapY":36.849},{"id":103,"name":"ร้าน แต้ฮกเซ้ง","region":"ภาคอีสาน","phone":"","address":"950-2 ถนนอุบล ตำบลเมืองใต้ อำเภอเมืองศรีสะเกษ จังหวัดศรีสะเกษ 33000","province":"ศรีสะเกษ","district":"เมืองศรีสะเกษ","mapX":80.145,"mapY":39.412},{"id":104,"name":"บริษัท ตั้งงี่สุนซูเปอร์สโตร์ จำกัด","region":"ภาคอีสาน","phone":"","address":"119-121-123 ถนนโพศรี ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000","province":"อุดรธานี","district":"เมืองอุดรธานี","mapX":64.295,"mapY":20.98},{"id":105,"name":"หจก. ถูก ป.ซุปเปอร์สโตร์ เลิงเก่า","region":"ภาคอีสาน","phone":"","address":"707 หมู่ที่ 1 ตำบลสวาท อำเภอเลิงนกทา จังหวัดยโสธร 35120","province":"ยโสธร","district":"เลิงนกทา","mapX":79.531,"mapY":31.586},{"id":106,"name":"บริษัท ที.อาร์.ซุปเปอร์มาร์เก็ต จำกัด","region":"ภาคอีสาน","phone":"","address":"44/11 ถนนพิทักษ์พนมเขต ตำบลมุกดาหาร อำเภอเมืองมุกดาหาร จังหวัดมุกดาหาร 49000","province":"มุกดาหาร","district":"ตำบลมุกดาหาร อำเภอเมืองมุกดาหาร","mapX":85.235,"mapY":27.168},{"id":107,"name":"บริษัท ทวีกิจพลาซ่าบุรีรัมย์ จำกัด","region":"ภาคอีสาน","phone":"081-9777722","address":"393/2 ถนนจิระ ตำบลในเมือง อำเภอเมืองบุรีรัมย์ จังหวัดบุรีรัมย์ 31000","province":"บุรีรัมย์","district":"เมืองบุรีรัมย์","mapX":67.033,"mapY":37.24},{"id":108,"name":"หจก. ทรงทรัพย์เจริญ","region":"ภาคอีสาน","phone":"087-0444880","address":"373 หมู่บ้าน บ้านปลาดุก หมู่ที่ 16 ตำบลไร่น้อย อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000","province":"อุบลราชธานี","district":"เมืองอุบลราชธานี","mapX":87.913,"mapY":35.237},{"id":109,"name":"บริษัท นานาภัณฑ์ ยโสธร พลาซ่า จำกัด","region":"ภาคอีสาน","phone":"","address":"44/4 ซอยนานาภัณฑ์ ถนนวิทยะธำรงค์ ตำบลในเมือง อำเภอเมืองยโสธร จังหวัดยโสธร 35000","province":"ยโสธร","district":"เมืองยโสธร","mapX":78.763,"mapY":31.977},{"id":110,"name":"ร้าน นางรองกิ๊ฟช็อป","region":"ภาคอีสาน","phone":"095-0270265","address":"206/10 ถนนประจันตเขต ตำบลนางรอง อำเภอนางรอง จังหวัดบุรีรัมย์ 31110","province":"บุรีรัมย์","district":"ตำบลนางรอง อำเภอนางรอง","mapX":67.52,"mapY":36.172},{"id":111,"name":"ร้าน นาตยาบิวตี้","region":"ภาคอีสาน","phone":"","address":"1/16-17 หมู่ที่ 1 ถนนเทศบาลบำรุง ตำบลในเมือง อำเภอเมืองร้อยเอ็ด จังหวัดร้อยเอ็ด 45000","province":"ร้อยเอ็ด","district":"เมืองร้อยเอ็ด","mapX":79.43,"mapY":32.895},{"id":112,"name":"หจก. บิ๊กคอมพลาซ่า","region":"ภาคอีสาน","phone":"","address":"219 หมู่ที่ 7 ตำบลพรเจริญ อำเภอพรเจริญ จังหวัดบึงกาฬ 38180","province":"บึงกาฬ","district":"พรเจริญ","mapX":74.281,"mapY":16.901},{"id":113,"name":"หจก. ประทาย มาร์ท","region":"ภาคอีสาน","phone":"089-2892803141","address":"512 หมู่ที่ 14 ตำบลประทาย อำเภอประทาย จังหวัดนครราชสีมา 30180","province":"นครราชสีมา","district":"ประทาย","mapX":52.575,"mapY":37.298},{"id":114,"name":"บริษัท ปอดาร์ จำกัด","region":"ภาคอีสาน","phone":"090-2536320","address":"680/2 ถนนมิตรภาพ ตำบลปากช่อง อำเภอปากช่อง จังหวัดนครราชสีมา 30130","province":"นครราชสีมา","district":"ปากช่อง","mapX":54.122,"mapY":36.97},{"id":115,"name":"บริษัท เพชรเกษมดีพาร์ทเมนท์สโตร์ จำกัด","region":"ภาคอีสาน","phone":"","address":"233 ถนนเทศบาล 1 ตำบลในเมือง อำเภอเมืองสุรินทร์ จังหวัดสุรินทร์ 32000","province":"สุรินทร์","district":"เมืองสุรินทร์","mapX":71.798,"mapY":37.605},{"id":116,"name":"หจก. พลอยบิวตี้","region":"ภาคอีสาน","phone":"061-109-8311","address":"5/3-4 หมู่ที่ 5 ตำบลทุ่งกระเต็น อำเภอหนองกี่ จังหวัดบุรีรัมย์ 31210","province":"บุรีรัมย์","district":"หนองกี่","mapX":67.92,"mapY":37.448},{"id":117,"name":"หจก. พลอยซุปเปอร์","region":"ภาคอีสาน","phone":"","address":"436/1 ถนนอภิบาลบัญชา ตำบลในเมือง อำเภอเมืองนครพนม จังหวัดนครพนม 48000","province":"นครพนม","district":"เมืองนครพนม","mapX":86.284,"mapY":23.25},{"id":118,"name":"หจก. พาโชคมินิมาร์ท","region":"ภาคอีสาน","phone":"091-8327565","address":"598/1 หมู่ที่ 10 ตำบลหนองไผ่ อำเภแก้งคร้อ จังหวัดชัยภูมิ 36150","province":"ชัยภูมิ","district":"","mapX":54.509,"mapY":26.25},{"id":119,"name":"บริษัท พลอยประดับดิน จำกัด","region":"ภาคอีสาน","phone":"042-190299","address":"428 หมู่ที่ 4 ตำบลศรีสงคราม อำเภอศรีสงคราม จังหวัดนครพนม 48150","province":"นครพนม","district":"ศรีสงคราม","mapX":85.516,"mapY":23.642},{"id":120,"name":"บริษัท ไฟว์สตาร์มาร์โค จำกัด","region":"ภาคอีสาน","phone":"086 255 0101","address":"2/2 ถนนไปหัวทะเล ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000","province":"นครราชสีมา","district":"เมืองนครราชสีมา","mapX":53.141,"mapY":38.337},{"id":121,"name":"บริษัท ยืนยงไฮเปอร์มาร์ท จำกัด","region":"ภาคอีสาน","phone":"","address":"23/33-40 ถนนอนุวรรตน์ ตำบลในเมือง อำเภอเมืองบุรีรัมย์ จังหวัดบุรีรัมย์ 31000","province":"บุรีรัมย์","district":"เมืองบุรีรัมย์","mapX":66.653,"mapY":36.706},{"id":122,"name":"บริษัท ยงสงวนกรุ๊ป จำกัด","region":"ภาคอีสาน","phone":"","address":"44/1 ถนนแก้วเสนา ตำบลวารินชำราบ อำเภอวารินชำราบ จังหวัดอุบลราชธานี 34190","province":"อุบลราชธานี","district":"วารินชำราบ","mapX":87.145,"mapY":35.629},{"id":123,"name":"บริษัท ร้อยเอ็ดพลาซ่า จำกัด","region":"ภาคอีสาน","phone":"043-515394,081-6426364","address":"17/1 ถนนเพลินจิต ตำบลในเมือง อำเภอเมืองร้อยเอ็ด จังหวัดร้อยเอ็ด 45000","province":"ร้อยเอ็ด","district":"เมืองร้อยเอ็ด","mapX":78.662,"mapY":33.287},{"id":124,"name":"หจก. วิบูลย์ซุปเปอร์มาร์เก็ต","region":"ภาคอีสาน","phone":"","address":"118-120 ถนนสุริยเดชบำรุง ตำบลในเมือง อำเภอเมืองร้อยเอ็ด จังหวัดร้อยเอ็ด 45000","province":"ร้อยเอ็ด","district":"เมืองร้อยเอ็ด","mapX":79.149,"mapY":32.218},{"id":125,"name":"หจก. วิชิตสินมาร์ท","region":"ภาคอีสาน","phone":"","address":"288/166 หมู่ที่ 9 ตำบลบุ่ง อำเภอเมืองอำนาจเจริญ จังหวัดอำนาจเจริญ 37000","province":"อำนาจเจริญ","district":"เมืองอำนาจเจริญ","mapX":83.843,"mapY":31.428},{"id":126,"name":"หจก. วันดีสโตร์","region":"ภาคอีสาน","phone":"","address":"429 หมู่ที่ 4 ถนนมีชัย ตำบลในเมือง อำเภอเมืองหนองคาย จังหวัดหนองคาย 43000","province":"หนองคาย","district":"เมืองหนองคาย","mapX":63.179,"mapY":18.221},{"id":127,"name":"หจก. วนิดามินิมาร์ท","region":"ภาคอีสาน","phone":"","address":"297/14-15 ซอยมิตรภาพ 15 ถนนมิตรภาพ ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000","province":"นครราชสีมา","district":"เมืองนครราชสีมา","mapX":52.933,"mapY":36.576},{"id":128,"name":"บริษัท วาวา 2559 จำกัด","region":"ภาคอีสาน","phone":"02-1147931","address":"244 หมู่บ้าน น้ำฆ้อง หมู่ที่ 15 ตำบลพันดอน อำเภอกุมภวาปี จังหวัดอุดรธานี 41370","province":"อุดรธานี","district":"กุมภวาปี","mapX":63.527,"mapY":21.372},{"id":129,"name":"ร้าน ศรีเจริญพานิช","region":"ภาคอีสาน","phone":"081-9762881","address":"336/33-34ก ถนนราชทัณฑ์ ตำบลในเมืง อำเภอเมืองชัยภูมิ จังหวัดชัยภูมิ 36000","province":"ชัยภูมิ","district":"เมืองชัยภูมิ","mapX":53.741,"mapY":26.642},{"id":130,"name":"ร้าน ศักดิ์ชัย พาณิชย์","region":"ภาคอีสาน","phone":"","address":"779 ถนนคำภูแสน ตำบลเจริญศิลย์ อำเภอเจริญศิลย์ จังหวัดสกลนคร 47290","province":"สกลนคร","district":"เจริญศิลย์","mapX":80.789,"mapY":22.862},{"id":131,"name":"หจก. เสาวนีย์ บิ๊กมาร์ท","region":"ภาคอีสาน","phone":"","address":"35 ถนนวรบุตร ตำบลตลาด อำเภอเมืองมหาสารคาม จังหวัดมหาสารคาม 44000","province":"มหาสารคาม","district":"เมืองมหาสารคาม","mapX":72.07,"mapY":29.197},{"id":132,"name":"หจก. เสาวนีย์ บิ๊กมาร์ท","region":"ภาคอีสาน","phone":"","address":"35 ถนนวรบุตร ตำบลตลาด อำเภอเมืองมหาสารคาม จังหวัดมหาสารคาม 44000","province":"มหาสารคาม","district":"เมืองมหาสารคาม","mapX":71.303,"mapY":29.589},{"id":133,"name":"หจก. หนองคายแสงสุวรรณ","region":"ภาคอีสาน","phone":"","address":"1152/2 หมู่ที่ 4 ตำบลในเมือง อำเภอเมืองหนองคาย จังหวัดหนองคาย 43000","province":"หนองคาย","district":"เมืองหนองคาย","mapX":63.666,"mapY":17.152},{"id":134,"name":"บริษัท ใหม่ซุปเปอร์มาร์เก็ต จำกัด","region":"ภาคอีสาน","phone":"089-610-0999","address":"363/2 ถนนนิตโย ตำบลหนองญาติ อำเภอเมืองนครพนม จังหวัดนครพนม 48000","province":"นครพนม","district":"เมืองนครพนม","mapX":86.003,"mapY":22.573},{"id":135,"name":"หจก. อุบลพลาซ่า","region":"ภาคอีสาน","phone":"","address":"145-147-149 ถนนอุปราช ตำบลในเมือง อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000","province":"อุบลราชธานี","district":"เมืองอุบลราชธานี","mapX":87.632,"mapY":34.56},{"id":136,"name":"หจก. เอี่ยมอัญ มาร์ท","region":"ภาคอีสาน","phone":"","address":"240 หมู่ที่ 3 ตำบลโนนแดง อำเภอโนนแดง จังหวัดนครราชสีมา 30360","province":"นครราชสีมา","district":"โนนแดง","mapX":54.339,"mapY":37.79},{"id":137,"name":"บริษัท อรัญชัย 2019 จำกัด","region":"ภาคอีสาน","phone":"","address":"34,36,38,40 ถนนเทศบาล 19 ตำบลปากช่อง อำเภอปากช่อง จังหวัดนครราชสีมา 30130","province":"นครราชสีมา","district":"ปากช่อง","mapX":52.402,"mapY":37.845},{"id":138,"name":"หจก. อุบลรวมสินไทย","region":"ภาคอีสาน","phone":"","address":"90-98 ถนนอุปราช ตำบลในเมือง อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000","province":"อุบลราชธานี","district":"เมืองอุบลราชธานี","mapX":88.033,"mapY":35.837},{"id":139,"name":"หจก. อุบลหงษ์ทอง ซี. แอนด์ ไอ.","region":"ภาคอีสาน","phone":"","address":"29 ถนนสถลมาร์ค ตำบลวารินชำราบ อำเภอวารินชำราบ จังหวัดอุบลราชธานี 34190","province":"อุบลราชธานี","district":"วารินชำราบ","mapX":86.766,"mapY":35.094},{"id":140,"name":"บริษัท อุบล ดีมาร์ท (2001) จำกัด","region":"ภาคอีสาน","phone":"","address":"46 ถนนแก้วเสนา ตำบลวารินชำราบ อำเภอวารินชำราบ จังหวัดอุบลราชธานี 34190","province":"อุบลราชธานี","district":"วารินชำราบ","mapX":88.313,"mapY":34.766},{"id":141,"name":"บริษัท อึ้งเซ้งเฮง (1994) จำกัด","region":"ภาคอีสาน","phone":"","address":"89/13 อาคารตรงข้ามการเคหะชุมชนอุดรธานี หมู่ที่ 5 ถนนเลี่ยงเมือง ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000","province":"อุดรธานี","district":"เมืองอุดรธานี","mapX":64.014,"mapY":20.303},{"id":142,"name":"บริษัท อาร์ เอส โฮลเซล จำกัด","region":"ภาคอีสาน","phone":"","address":"333 หมู่ที่ 15 ตำบลบ้านเป็ด อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000","province":"ขอนแก่น","district":"เมืองขอนแก่น","mapX":63.239,"mapY":29.356},{"id":143,"name":"หจก. อุเทน ซุปเปอร์แวร์","region":"ภาคอีสาน","phone":"","address":"302 หมู่ที่ 1 ตำบลท่าสองคอน อำเภอเมืองมหาสารคาม จังหวัดมหาสารคาม 44000","province":"มหาสารคาม","district":"เมืองมหาสารคาม","mapX":71.79,"mapY":28.521},{"id":144,"name":"บริษัท โอเชียนซุปเปอร์สโตร์ จำกัด","region":"ภาคอีสาน","phone":"063-0145254","address":"34/1 หมู่ที่ 3 ตำบลหนองบัว อำเภอเมืองหนองบัวลำภู จังหวัดหนองบัวลำภู 39000","province":"หนองบัวลำภู","district":"เมืองหนองบัวลำภู","mapX":56.371,"mapY":21.658},{"id":145,"name":"ร้าน ไอซี่ บิวตี้","region":"ภาคอีสาน","phone":"093-4752627","address":"65 ถนนวรบุตร ตำบลตลาด อำเภอเมืองมหาสารคาม จังหวัดมหาสารคาม 44000","province":"มหาสารคาม","district":"เมืองมหาสารคาม","mapX":72.19,"mapY":29.797},{"id":146,"name":"ร้าน เฮงวาณิชย์","region":"ภาคอีสาน","phone":"044 649 078","address":"97/5 หมู่ที่ 2 ตำบลละหานทราย อำเภอละหานทราย จังหวัดบุรีรัมย์ 31170","province":"บุรีรัมย์","district":"ละหานทราย","mapX":68.2,"mapY":36.378},{"id":147,"name":"หจก. เจน ซุปเปอร์มาร์เก็ต","region":"ภาคอีสาน","phone":"080-1991644","address":"251-252 หมู่ที่ 1 ถ.เจนจบทิศ ต.ในเมือง อ.บ้านไผ่ จ.ขอนแก่น 40110","province":"ขอนแก่น","district":"บ้านไผ่","mapX":63.64,"mapY":30.633},{"id":148,"name":"ร้าน ซุปเปอร์บิ๊ก","region":"ภาคอีสาน","phone":"062-5406283,061-4678370","address":"126 บ้านดินดำพัฒนา 11 ต.บ้านเกิ้ง อ.เมือง จ.มหาสารคาม 44000","province":"มหาสารคาม","district":"เมือง","mapX":70.923,"mapY":29.055},{"id":149,"name":"ร้าน แต้ฮกเซ้ง","region":"ภาคอีสาน","phone":"","address":"950-2 ถนนอุบล ตำบลเมืองใต้ อำเภอเมืองศรีสะเกษ จังหวัดศรีสะเกษ 33000","province":"ศรีสะเกษ","district":"เมืองศรีสะเกษ","mapX":80.632,"mapY":38.343},{"id":150,"name":"ร้าน ท็อปถุงทอง","region":"ภาคอีสาน","phone":"098 887 4692","address":"192/14 บ้านนาสวรรค์ ตำบลหนองสนม อำเภอวานรนิวาส จังหวัดสกลนคร 47120","province":"สกลนคร","district":"วานรนิวาส","mapX":80.022,"mapY":23.254},{"id":151,"name":"ร้าน มันนี่ บิวตี้ ช้อป","region":"ภาคอีสาน","phone":"099-5565229","address":"177 หมู่ที่ 11 ตำบลท่าพระ อำเภอเมือง จังหวัดขอนแก่น 40260","province":"ขอนแก่น","district":"เมือง","mapX":62.372,"mapY":29.89},{"id":152,"name":"ร้าน บัวซักอบรีด","region":"ภาคอีสาน","phone":"081-6284606","address":"118/60 ถนนเทศบาล16 ตำบลปากช่อง อำเภอปากช่อง จังหวัดนครราชสีมา 30180","province":"นครราชสีมา","district":"ปากช่อง","mapX":53.848,"mapY":36.445},{"id":153,"name":"ร้าน วัจนา(พี่อ๋อย)","region":"ภาคอีสาน","phone":"043-581302,085-6351162,082-0919165","address":"144 ถ.ประดิษฐ์ยุทธการ ต.สระคู อ.สุวรรณภูมิ จ.ร้อยเอ็ด 45130","province":"ร้อยเอ็ด","district":"สุวรรณภูมิ","mapX":79.55,"mapY":33.494},{"id":154,"name":"ร้าน ศรีเจริญ","region":"ภาคอีสาน","phone":"044 471 108","address":"ตำบล ในเมือง อำเภอพิมาย นครราชสีมา 30110","province":"นครราชสีมา","district":"พิมาย นครราชสีมา","mapX":53.722,"mapY":38.525},{"id":155,"name":"ร้าน สองพี่น้องคอสเมติก","region":"ภาคอีสาน","phone":"084-515-9211,083-6986764","address":"ตลาดพรเพชร ถ.ดอนตาล อ.เมือง จังหวัดมุกดาหาร 49000","province":"มุกดาหาร","district":"เมือง","mapX":85.722,"mapY":26.1},{"id":156,"name":"หจก. เสรีภัณฑ์ 2017","region":"ภาคอีสาน","phone":"081-8795517","address":"242/1 หมู่ที่ 16 ต.สีคิ้ว อ.สีคิ้ว จ.นครราชสีมา 30140","province":"นครราชสีมา","district":"สีคิ้ว","mapX":52.369,"mapY":36.853},{"id":157,"name":"ร้าน อเล็กซ์ซุปเปอร์","region":"ภาคอีสาน","phone":"092-2794066","address":"47-49 ถ.คุรุสามัคคี ต.ปากช่อง อ.ปากช่อง จ.นครราชสีมา","province":"นครราชสีมา","district":"ปากช่อง","mapX":54.559,"mapY":37.182},{"id":158,"name":"หจก. อมรินทร์ ร้อยเอ็ด","region":"ภาคอีสาน","phone":"086-8511494","address":"22 ถนนรัฐกิจไคลคลา ตำบลในเมือง อำเภอเมืองร้อยเอ็ด จังหวัดร้อยเอ็ด 45000","province":"ร้อยเอ็ด","district":"เมืองร้อยเอ็ด","mapX":78.282,"mapY":32.752},{"id":159,"name":"ร้าน โอปอล์ ภูมิ","region":"ภาคอีสาน","phone":"085-3365659","address":"23 หมู่ที่ 8 ตำบลกลาง อำเภอเสลภู จังหวัดร้ยเอ็ด 45120","province":"ร้อยเอ็ด","district":"เสลภู","mapX":79.83,"mapY":32.424},{"id":160,"name":"บริษัท กนกกาญจน์ดีพาร์ทเม้นท์สโตร์ จำกัด","region":"ภาคกลาง","phone":"","address":"15 ซอย 3 ถนนอู่ทอง ตำบลบ้านเหนือ อำเภอเมืองกาญจนบุรี จังหวัดกาญจนบุรี 71000","province":"กาญจนบุรี","district":"เมืองกาญจนบุรี","mapX":30.138,"mapY":43.724},{"id":161,"name":"บริษัท กำมะเชียรค้าส่ง จำกัด","region":"ภาคกลาง","phone":"065-8989539","address":"4 หมู่ที่ 6 ตำบลเขาพระ อำเภอเดิมบางนางบวช จังหวัดสุพรรณบุรี 72120","province":"สุพรรณบุรี","district":"เดิมบางนางบวช","mapX":32.449,"mapY":37.829},{"id":162,"name":"บริษัท เจริญรัตน์ซุปเปอร์ จำกัด","region":"ภาคกลาง","phone":"081-9489204","address":"20 ถนนสุวพันธ์ 1 ตำบลตลาดหลวง อำเภอเมืองอ่างทอง จังหวัดอ่างทอง 14000","province":"อ่างทอง","district":"เมืองอ่างทอง","mapX":38.082,"mapY":39.553},{"id":163,"name":"หจก. เจริญรัตน์ ซูเปอร์มาร์เก็ต","region":"ภาคกลาง","phone":"064-4198236","address":"42 ถนนสมบุญ-เกตุวัลห์ ตำบลตลาดหลวง อำเภอเมืองอ่างทอง จังหวัดอ่างทอง 14000","province":"อ่างทอง","district":"เมืองอ่างทอง","mapX":37.314,"mapY":39.944},{"id":164,"name":"นาย จนุรักษ์ สัจจสัมมากุล","region":"ภาคกลาง","phone":"","address":"63 หมู่ที่ 7 ถนนอัมพวา-บางนกแขนก ตำบลบางนกแขวก อำเภอบางคนที จังหวัดสมุทรสงคราม 75120","province":"สมุทรสงคราม","district":"บางคนที","mapX":32.452,"mapY":46.796},{"id":165,"name":"บริษัท เจริญสิน กาญจนบุรี เทรดดิ้ง จำกัด","region":"ภาคกลาง","phone":"081-7335285","address":"126 หมู่ที่ 9 ตำบลหนองลู อำเภอสังขละบุรี จังหวัดกาญจนบุรี 71240","province":"กาญจนบุรี","district":"สังขละบุรี","mapX":29.37,"mapY":44.115},{"id":166,"name":"ร้าน ฉัตรชัย 2 มินิมาร์ท","region":"ภาคกลาง","phone":"035-763649","address":"93/1 หมู่ที่ 11 ตำบลบางนมโค อำเภอเสนา จังหวัดพระนครศรีอยุธยา 13110","province":"พระนครศรีอยุธยา","district":"เสนา","mapX":37.464,"mapY":41.263},{"id":167,"name":"บริษัท ไชยแสงดีพาร์ทเม้นท์สโตร์ จำกัด","region":"ภาคกลาง","phone":"","address":"910 ถนนขุนสรรค์ ตำบลบางพุทรา อำเภอเมืองสิงห์บุรี จังหวัดสิงห์บุรี 16000","province":"สิงห์บุรี","district":"เมืองสิงห์บุรี","mapX":37.464,"mapY":37.566},{"id":168,"name":"บริษัท แต่ซุ่งไถ่ เทรดดิ้ง จำกัด","region":"ภาคกลาง","phone":"","address":"46 ถนนอ่างทอง-สิงห์บุรี ตำบลย่านซื่อ อำเภอเมืองอ่างทอง จังหวัดอ่างทอง 14000","province":"สิงห์บุรี","district":"เมืองอ่างทอง","mapX":36.696,"mapY":37.958},{"id":169,"name":"บริษัท ทรัพย์ธงชัย (2017) จำกัด","region":"ภาคกลาง","phone":"","address":"285/27 หมู่ที่ 8 ตำบลดำเนินสะดวก อำเภอดำเนินสะดวก จังหวัดราชบุรี 70130","province":"ราชบุรี","district":"ดำเนินสะดวก","mapX":31.497,"mapY":44.632},{"id":170,"name":"หจก. ไทยทอยส์ ค้าส่ง","region":"ภาคกลาง","phone":"094-7255595","address":"204 ถนนราษฎร์รวมใจ ตำบลในเมือง อำเภอเมืองกำแพงเพชร จังหวัดกำแพงเพชร 62000","province":"กำแพงเพชร","district":"เมืองกำแพงเพชร","mapX":27.281,"mapY":27.151},{"id":171,"name":"หจก. ไทยทอยส์ มาร์เก็ต ค้าส่ง","region":"ภาคกลาง","phone":"081-4951995","address":"91 หมู่ที่ 6 ตำบลโพตลาดแก้ว อำเภอท่าวุ้ง จังหวัดลพบุรี 15150","province":"ลพบุรี","district":"ท่าวุ้ง","mapX":39.022,"mapY":38.537},{"id":172,"name":"บริษัท นครปฐมไพศาล จำกัด","region":"ภาคกลาง","phone":"","address":"495/1 ถนนเพชรเกษม ตำบลห้วยจรเข้ อำเภอเมืองนครปฐม จังหวัดนครปฐม 73000","province":"นครปฐม","district":"เมืองนครปฐม","mapX":35.082,"mapY":44.822},{"id":173,"name":"ร้าน แนนบิวตี้","region":"ภาคกลาง","phone":"","address":"12 ถนนบางเมือง ตำบลท่าหิน อำเภอเมืองลพบุรี จังหวัดลพบุรี 15000","province":"ลพบุรี","district":"เมืองลพบุรี","mapX":39.509,"mapY":37.468},{"id":174,"name":"บริษัท พี พี ซูเปอร์เซ็นเตอร์ จำกัด","region":"ภาคกลาง","phone":"089-9110737","address":"35/551 ถนนบ้านปากแรต ตำบลบ้านโป่ง อำเภอบ้านโป่ง จังหวัดราชบุรี 70110","province":"ราชบุรี","district":"บ้านโป่ง","mapX":30.73,"mapY":45.023},{"id":175,"name":"บริษัท พัชราซุปเปอร์มาร์เก็ต จำกัด","region":"ภาคกลาง","phone":"","address":"819-819/1-4 ซอยบ้านเช่า ถนนสรรเพชร ตำบลมหาชัย อำเภอเมืองสมุทรสาคร จังหวัดสมุทรสาคร 74000","province":"สมุทรสาคร","district":"เมืองสมุทรสาคร","mapX":36.025,"mapY":46.493},{"id":176,"name":"บริษัท ราชบุรีจังหวัดพาณิชย์ จำกัด","region":"ภาคกลาง","phone":"","address":"4,6,8,10 ถนนประชากิจ ตำบลหน้าเมือง อำเภอเมืองราชบุรี จังหวัดราชบุรี 70000","province":"ราชบุรี","district":"เมืองราชบุรี","mapX":31.217,"mapY":43.955},{"id":177,"name":"บริษัท ลิ้มน่ำเฮง จำกัด","region":"ภาคกลาง","phone":"","address":"132 หมู่ที่ 1 ตำบลสร้อยฟ้า อำเภอโพธาราม จังหวัดราชบุรี 70120","province":"ราชบุรี","district":"โพธาราม","mapX":31.617,"mapY":45.231},{"id":178,"name":"บริษัท วรรณมาบตาพุด (2022) จำกัด","region":"ภาคกลาง","phone":"089-7486594","address":"299/99 ถนนเนินพยอม ตำบลมาบตาพุด อำเภอเมืองระยอง จังหวัดระยอง 21150","province":"ระยอง","district":"เมืองระยอง","mapX":44.934,"mapY":52.186},{"id":179,"name":"บริษัท ศรีงาม สรรพสินค้า จำกัด","region":"ภาคกลาง","phone":"081-5873516 ซ้อเปิ้ล","address":"88 หมู่ที่ 8 ถนนเศรษฐกิจ 1 ตำบลคลองมะเดื่อ อำเภอกระทุ่มแบน จังหวัดสมุทรสาคร 74110","province":"สมุทรสาคร","district":"กระทุ่มแบน","mapX":35.258,"mapY":46.885},{"id":180,"name":"บริษัท สุขอนันต์ ปาร์ค จำกัด","region":"ภาคกลาง","phone":"036-220099","address":"179/5 ถนนสุดบรรทัด ตำบลปากเพรียว อำเภอเมืองสระบุรี จังหวัดสระบุรี 18000","province":"สระบุรี","district":"เมืองสระบุรี","mapX":43.843,"mapY":39.566},{"id":181,"name":"หจก. อัมพร สรรพสินค้า จำกัด","region":"ภาคกลาง","phone":"","address":"10/1 ถนนนเรศวร ตำบลหอรัตนไชย อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา 13000","province":"พระนครศรีอยุธยา","district":"พระนครศรีอยุธยา","mapX":36.696,"mapY":41.655},{"id":182,"name":"ร้าน อะตอมค้าส่ง","region":"ภาคกลาง","phone":"0851864222อ","address":"61 หมู่ที่ 4 ตำบลบางนมโค อำเภอเสนา จังหวัดพระนครศรีอยุธยา 13110","province":"พระนครศรีอยุธยา","district":"เสนา","mapX":37.183,"mapY":40.586},{"id":183,"name":"ร้าน กานดาซุปเปอร์มาร์ท","region":"ภาคกลาง","phone":"","address":"ตำบลสามง่าม อำเภอดอนตูม จังหวัดนครปฐม","province":"นครปฐม","district":"ดอนตูม","mapX":34.314,"mapY":45.214},{"id":184,"name":"ร้าน กานดาซุปเปอร์มาร์ท","region":"ภาคกลาง","phone":"081-1959192","address":"อำเภอนครชัยศรี นครปฐม 73120","province":"นครปฐม","district":"นครชัยศรี นครปฐม","mapX":34.801,"mapY":44.146},{"id":185,"name":"ร้าน กิจเจริญ","region":"ภาคกลาง","phone":"034-766496","address":"อ.เมือง ต.แม่กลอง อ.เมืองสมุทรสงคราม จังหวัดสมุทรสงคราม 75000","province":"สมุทรสงคราม","district":"เมือง ต.แม่กลอง อ.เมืองสมุทรสงคราม","mapX":31.685,"mapY":47.188},{"id":186,"name":"ร้าน โค้วกี่เชย","region":"ภาคกลาง","phone":"034 411 144","address":"586, 57 ซอยสุขาภิบาล ตำบลมหาชัย อำเภอเมืองสมุทรสาคร จังหวัดสมุทรสาคร 74000","province":"สมุทรสาคร","district":"เมืองสมุทรสาคร","mapX":35.745,"mapY":45.817},{"id":187,"name":"ร้าน เซเว่นซุปเปอร์","region":"ภาคกลาง","phone":"086-3300250","address":"108-110 ถนนสุระสงคราม อำเภอเมือง ตำบล ท่าหิน อำเภอเมืองลพบุรี ลพบุรี 15000","province":"ลพบุรี","district":"เมือง ตำบล ท่าหิน อำเภอเมืองลพบุรี ลพบุรี","mapX":39.909,"mapY":38.744},{"id":188,"name":"ร้าน พิกุลทอง","region":"ภาคกลาง","phone":"092-4631391","address":"215-9 ถนนปิยะบุตร ตำบลบ้านหมี่ อำเภอบ้านหมี่ จังหวัดลพบุรี 15110","province":"ลพบุรี","district":"บ้านหมี่","mapX":38.642,"mapY":38.002},{"id":189,"name":"ร้าน มหาทรัพย์สโตร์","region":"ภาคกลาง","phone":"","address":"87-9 ถนนทรงพล ตำบลบ้านโป่ง อำเภอบ้านโป่ง จังหวัดราชบุรี 70110","province":"ราชบุรี","district":"บ้านโป่ง","mapX":30.35,"mapY":44.489},{"id":190,"name":"ร้าน ย่งเส็งเชียง","region":"ภาคกลาง","phone":"089-6118601","address":"251/3 ตลาด ตำบล สามพราน อำเภอสามพราน นครปฐม 73110","province":"นครปฐม","district":"สามพราน นครปฐม","mapX":35.201,"mapY":45.422},{"id":191,"name":"ร้าน หยกฟ้า","region":"ภาคกลาง","phone":"081-9460695","address":"892/86-7 ถนนพันเรือง ตำบลบางพุทรา อำเภอเมืองสิงห์บุรี จังหวัดสิงห์บุรี 16000","province":"สิงห์บุรี","district":"เมืองสิงห์บุรี","mapX":37.183,"mapY":36.889},{"id":192,"name":"ร้าน สหคุณ","region":"ภาคกลาง","phone":"081-8589947,032-338-954","address":"8/1 ถนนทรัพย์คีรี ตำบลหน้าเมือง อำเภอเมืองราชบุรี จังหวัดราชบุรี 70000","province":"ราชบุรี","district":"เมืองราชบุรี","mapX":31.897,"mapY":44.161},{"id":193,"name":"ร้าน เกียรติเจริญ","region":"กทม./ปริมณฑล","phone":"095-529-9222","address":"32/7 หมู่ที่ 4 ถนนรามอินทรา ตำบลอนุสาวรีย์ อำเภอบางเขน กรุงเทพมหานคร 10220","province":"กรุงเทพมหานคร","district":"บางเขน กรุงเทพมหานคร","mapX":38.542,"mapY":45.046},{"id":194,"name":"หสม. กิ้มฮะเชียง","region":"กทม./ปริมณฑล","phone":"","address":"528 ตรอกวัดกันมาตุยาราม ถนนทรงวาด แขวงจักรวรรดิ เขตสัมพันธวงศ์ กรุงเทพมหานคร 10100","province":"กรุงเทพมหานคร","district":"สัมพันธวงศ์ กรุงเทพมหานคร","mapX":37.775,"mapY":45.438},{"id":195,"name":"บริษัท ควอลิตี้ ดรัก จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"114 - 116 ถนนศรีสมุทร ตำบลปากน้ำ อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ 10270","province":"สมุทรปราการ","district":"เมืองสมุทรปราการ","mapX":38.913,"mapY":45.684},{"id":196,"name":"หจก. งามทิพย์สรรพสินค้า","region":"กทม./ปริมณฑล","phone":"095-529-9222","address":"714,716,718 ถนนสามเสน แขวงถนนนครไชยศรี เขตดุสิต กรุงเทพมหานคร 10300","province":"กรุงเทพมหานคร","district":"ดุสิต กรุงเทพมหานคร","mapX":38.262,"mapY":44.369},{"id":197,"name":"บริษัท ชัยวิวัฒน์ เอส.พี. จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"339 หมู่ที่ 8 ตำบลสำโรงเหนือ อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ 10270","province":"สมุทรปราการ","district":"เมืองสมุทรปราการ","mapX":38.145,"mapY":46.076},{"id":198,"name":"บริษัท โชคชัย ซุปเปอร์สโตร์ จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"230 หมู่ที่ 7 ตำบลพิมลราช อำเภอบางบัวทอง จังหวัดนนทบุรี 11110","province":"นนทบุรี","district":"บางบัวทอง","mapX":37.666,"mapY":43.987},{"id":199,"name":"ร้าน ซันเต้มาร์ท","region":"กทม./ปริมณฑล","phone":"","address":"เลขที่ 8,10,109 111 ซอย นนทบุรี 29 ท่าทราย อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000","province":"นนทบุรี","district":"เมืองนนทบุรี","mapX":36.898,"mapY":44.379},{"id":200,"name":"บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)","region":"กทม./ปริมณฑล","phone":"","address":"1468 ถนนพัฒนาการ แขวงพัฒนาการ เขตสวนหลวง จังหวัดกรุงเทพมหานคร 10250","province":"กรุงเทพมหานคร","district":"สวนหลวง","mapX":38.662,"mapY":45.646},{"id":201,"name":"บริษัท เซ็นทรัล ฟู้ด รีเทล จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"สาขาดีซี 70 หมู่ที่ 6 ตำบลละหาร อำเภอบางบัวทอง จังหวัดนนทบุรี 10110","province":"นนทบุรี","district":"บางบัวทอง","mapX":37.385,"mapY":43.31},{"id":202,"name":"บริษัท เซ็นทรัล ฟู้ด โฮลเซลล์ จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"สาขาศูนย์กระจายสินค้าบางนา 103 หมู่ที่ 1 ตำบลศีรษะ อำเภอบางเสาธง จังหวัดสมุทรปราการ 10570","province":"สมุทรปราการ","district":"บางเสาธง","mapX":38.632,"mapY":45.007},{"id":203,"name":"บริษัท ดี.ดี ยั่งยืน จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"240 หมู่ที่ 3 ถนนสุขสวัสดิ์ ตำบลปากคลองบางปลากด อำเภอพระสมุทรเจดีย์ จังหวัดสมุทรปราการ 10290","province":"สมุทรปราการ","district":"พระสมุทรเจดีย์","mapX":39.033,"mapY":46.284},{"id":204,"name":"บริษัท เดอะมอลล์ กรุ๊ป จำกัด","region":"กทม./ปริมณฑล","phone":"02310-1000","address":"55/92 หมู่ที่ 15 ตำบลบางเสาธง อำเภอบางเสาธง จังหวัดสมุทรปราการ 10570","province":"สมุทรปราการ","district":"บางเสาธง","mapX":37.766,"mapY":45.541},{"id":205,"name":"ร้าน ตั้กเต๋า","region":"กทม./ปริมณฑล","phone":"","address":"250/477 หมู่บ้านกรีนวิลล์ ถนนพุทธมลฑลสาย2 ซอย32 แขวงศาลาธรรมสพน์ เขตทวีวัฒนา กรุงเทพมหานคร 10170","province":"กรุงเทพมหานคร","district":"ทวีวัฒนา กรุงเทพมหานคร","mapX":37.395,"mapY":44.903},{"id":206,"name":"บริษัท ทุ่งสีกันเศรษฐกิจ จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"183 อาคารร้านค้าสวัสดิการกรมการสื่อสารทหาร ถนนสรงประภา แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210","province":"กรุงเทพมหานคร","district":"ดอนเมือง กรุงเทพมหานคร","mapX":38.942,"mapY":44.576},{"id":207,"name":"ร้าน นายกี้ (พระประแดง)","region":"กทม./ปริมณฑล","phone":"081-8697584","address":"39 ตำบลตลาด อำเภอพระประแดง จังหวัดสมุทรปราการ 10130","province":"สมุทรปราการ","district":"พระประแดง","mapX":39.313,"mapY":45.214},{"id":208,"name":"ร้าน บางแคสังฆภัณฑ์","region":"กทม./ปริมณฑล","phone":"","address":"680 ถนนเพชรเกษม แขวงบางแคเหนือ เขตบางแค กรุงเทพมหานคร 10160","province":"กรุงเทพมหานคร","district":"บางแค กรุงเทพมหานคร","mapX":37.961,"mapY":45.942},{"id":209,"name":"บริษัท บิ๊กซี ซูเปอร์เซ็นเตอร์ จำกัด (มหาชน)","region":"กทม./ปริมณฑล","phone":"","address":"88/9 ซอยสมานฉันท์ - บาร์โบส แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110","province":"กรุงเทพมหานคร","district":"คลองเตย กรุงเทพมหานคร","mapX":37.753,"mapY":44.181},{"id":210,"name":"บริษัท พี.วาย.กิจศิริ จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"1 ซอยบางแวก 82 แขวงคลองขวาง เขตภาษีเจริญ กรุงเทพมหานคร 10160","province":"กรุงเทพมหานคร","district":"ภาษีเจริญ กรุงเทพมหานคร","mapX":39.159,"mapY":45.396},{"id":211,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02 - 5300220","address":"2675 ถนนลาดพร้าว แขวงคลองเจ้าคุณสิงห์ เขตวังทองหลาง กรุงเทพมหานคร 10310","province":"กรุงเทพมหานคร","district":"วังทองหลาง กรุงเทพมหานคร","mapX":37.222,"mapY":45.451},{"id":212,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02 - 2344825","address":"9 ชั้นล่าง ถนนพัฒน์พงศ์ 2 แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500","province":"กรุงเทพมหานคร","district":"บางรัก กรุงเทพมหานคร","mapX":38.668,"mapY":44.051},{"id":213,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02 - 3146164","address":"17 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพมหานคร 10240","province":"กรุงเทพมหานคร","district":"บางกะปิ กรุงเทพมหานคร","mapX":38.542,"mapY":46.13},{"id":214,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02 - 7180447 -9","address":"2443 ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพมหานคร 10310","province":"กรุงเทพมหานคร","district":"ห้วยขวาง กรุงเทพมหานคร","mapX":37.189,"mapY":44.459},{"id":215,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"038 - 360170 - 2","address":"190/16 หมู่ที่ 9 ถนนพัทยากลาง ตำบลหนองปรือ อำเภอบางละมุง จังหวัดชลบุรี","province":"ชลบุรี","district":"บางละมุง","mapX":42.332,"mapY":53.455},{"id":216,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02 - 5512105 -6","address":"363 ถนนรามอินทรา แขวงอนุสาวรีย์ เขตบางเขน กรุงเทพมหานคร 10220","province":"กรุงเทพมหานคร","district":"บางเขน กรุงเทพมหานคร","mapX":39.379,"mapY":44.787},{"id":217,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02 - 2542179","address":"87 อาคารนายเลิศ ชั้นล่าง สุขุมวิท 5(ซอยเลิศสิน 1) ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร 10110","province":"กรุงเทพมหานคร","district":"วัฒนา กรุงเทพมหานคร","mapX":37.49,"mapY":46.059},{"id":218,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-0891620","address":"ชั้น 4 เลขที่ 629 ถนนนวมินทร์ แขวงนวมินทร์ เขตบึงกุ่ม กรุงเทพมหานคร 10240","province":"กรุงเทพมหานคร","district":"บึงกุ่ม กรุงเทพมหานคร","mapX":38.039,"mapY":43.787},{"id":219,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02 - 3833313","address":"336 หมู่ที่ 5 ถนนศรีนครินทร์ ตำบลสำโรงเหนือ อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ 10270","province":"สมุทรปราการ","district":"เมืองสมุทรปราการ","mapX":38.332,"mapY":46.58},{"id":220,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-4113333 ,  02-4113770","address":"262 ซอยจรัญสนิทวงศ์ 30 ถนนจรัญสนิทวงศ์ แขวงบ้านช่างหล่อ เขตบางกอกน้อย กรุงเทพมหานคร 10700","province":"กรุงเทพมหานคร","district":"บางกอกน้อย กรุงเทพมหานคร","mapX":39.196,"mapY":45.884},{"id":221,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02 - 5760606","address":"333/100 อาคารหลักสี่พลาซ่า ชั้นล่าง หมู่ที่ 4 ถนนแจ้งวัฒนะ แขวงตลาดบางเขน เขตหลักสี่ กรุงเทพมหานคร 10210","province":"กรุงเทพมหานคร","district":"หลักสี่ กรุงเทพมหานคร","mapX":36.874,"mapY":45.101},{"id":222,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-204-2288","address":"48 อาคารคอลัมน์ ชั้นหนึ่ง ซอยสุขุมวิท 16 (สามมิตร) ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110","province":"กรุงเทพมหานคร","district":"คลองเตย กรุงเทพมหานคร","mapX":39.165,"mapY":44.088},{"id":223,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-390-1188","address":"88/1 อาคาร เอททองหล่อ ซอย สุขุมวิท 55 (ทองหล่อ) ถนนสุขุมวิท แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110","province":"กรุงเทพมหานคร","district":"วัฒนา กรุงเทพมหานคร","mapX":38.138,"mapY":46.431},{"id":224,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"034-110839-40","address":"99/121 หมู่ที่ 4 ตำบลนาดี อำเภอเมืองสมุทรสาคร จังหวัด สมุทรสาคร 74000","province":"สมุทรสาคร","district":"เมืองสมุทรสาคร","mapX":36.145,"mapY":47.093},{"id":225,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-446-8080","address":"666 ชั้นล่าง ถนนบรมราชชนนี แขวงบางบำหรุ เขตบางพลัด กรุงเทพมหานคร 10700","province":"กรุงเทพมหานคร","district":"บางพลัด กรุงเทพมหานคร","mapX":37.297,"mapY":43.961},{"id":226,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-1165678","address":"199/10-11 หมู่6 ตำบลศาลายา อำเภอพุทธมณฑล จังหวัดนครปฐม 73170","province":"นครปฐม","district":"พุทธมณฑล","mapX":33.934,"mapY":44.68},{"id":227,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-0216789","address":"1869/7 ถนนเพชรเกษม แขวงหลักสอง เขตบางแค กรุงเทพมหานคร 10160","province":"กรุงเทพมหานคร","district":"บางแค กรุงเทพมหานคร","mapX":39.629,"mapY":45.238},{"id":228,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-007-5300","address":"15/9 ถนนพระรามที่ 2 แขวงท่าข้าม เขตบางขุนเทียน กรุงเทพมหานคร 10150","province":"กรุงเทพมหานคร","district":"บางขุนเทียน กรุงเทพมหานคร","mapX":36.999,"mapY":45.883},{"id":229,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-121-1911","address":"139 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400","province":"กรุงเทพมหานคร","district":"ดินแดง กรุงเทพมหานคร","mapX":38.529,"mapY":43.591},{"id":230,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-682-6212","address":"982 ถนนพระราม 3 แขวงบางโพงพาง เขตยานนาวา กรุงเทพมหานคร 10120","province":"กรุงเทพมหานคร","district":"ยานนาวา กรุงเทพมหานคร","mapX":38.956,"mapY":46.361},{"id":231,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"044-498-700 - 14","address":"99 ถนนมิตรภาพ-หนองคาย ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000","province":"นครราชสีมา","district":"เมืองนครราชสีมา","mapX":52.67,"mapY":38.454},{"id":232,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"033-252-000","address":"777 หมู่ที่ 6 ตำบลนาเกลือ อำเภอบางละมุง จังหวัดชลบุรี 20150","province":"ชลบุรี","district":"บางละมุง","mapX":42.124,"mapY":51.694},{"id":233,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-117-1028","address":"888 หมู่ที่ 1 ตำบลราชาเทวะ อำเภอบางพลี จังหวัดสมุทรปราการ 10540","province":"สมุทรปราการ","district":"บางพลี","mapX":38.124,"mapY":44.819},{"id":234,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-0891620","address":"629 ถนนนวมินทร์ แขวงนวมินทร์ เขตบึงกุ่ม กรุงเทพมหานคร 10240","province":"กรุงเทพมหานคร","district":"บึงกุ่ม กรุงเทพมหานคร","mapX":36.735,"mapY":44.578},{"id":235,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-0781851-54","address":"อาคารพาร์คสีลม เลขที่ 1 ถนนคอนแวนต์ แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500","province":"กรุงเทพมหานคร","district":"บางรัก กรุงเทพมหานคร","mapX":39.622,"mapY":44.39},{"id":236,"name":"บริษัท ฟู้ดแลนด์ซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"02-1197580-84","address":"388/9 ถนนสายไหม แขวงสายไหม เขตสายไหม กรุงเทพมหานคร 10220","province":"กรุงเทพมหานคร","district":"สายไหม กรุงเทพมหานคร","mapX":37.59,"mapY":46.51},{"id":237,"name":"บริษัท มิลเลนเนียม ไซเบอร์ เซอร์วิส จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"592/54 ถนนลาดปลาเค้า แขวงจรเข้บัว เขตลาดพร้าว กรุงเทพมหานคร 10230","province":"กรุงเทพมหานคร","district":"ลาดพร้าว กรุงเทพมหานคร","mapX":37.657,"mapY":43.531},{"id":238,"name":"บริษัท วันเดอร์ ดีพาร์ทเม้นท์สโตร์ จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"229 ถนนเพชรเกษม แขวงบางแค เขตบางแค กรุงเทพมหานคร 10160","province":"กรุงเทพมหานคร","district":"บางแค กรุงเทพมหานคร","mapX":39.647,"mapY":45.806},{"id":239,"name":"ร้าน สหกรณ์พระนคร จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"1215 ถนนพหลโยธิน ตำบลพญาไท อำเภอพญาไท กรุงเทพมหานคร 10400","province":"กรุงเทพมหานคร","district":"พญาไท กรุงเทพมหานคร","mapX":36.602,"mapY":45.468},{"id":240,"name":"บริษัท สองมาร์เก็ตติ้ง จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"32/10 หมู่ที่11 ตำบลบางแม่นาง อำเภอบางใหญ่ จังหวัดนนทบุรี 11140","province":"นนทบุรี","district":"บางใหญ่","mapX":37.786,"mapY":44.587},{"id":241,"name":"ร้าน สหกรณ์ กรุงเทพ จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"74/5 ถนนจรัญสนิทวงศ์ แขวงอรุณอมรินทร์ เขตบางกอกน้อย กรุงเทพมหานคร 10700","province":"กรุงเทพมหานคร","district":"บางกอกน้อย กรุงเทพมหานคร","mapX":39.109,"mapY":43.636},{"id":242,"name":"บริษัท สหชลผลพืช จำกัด","region":"กทม./ปริมณฑล","phone":"(038) 480011-4   FAX : (038) 480682","address":"955/559 หมู่ที่ 11 ถนนสุขาภิบาล8 ตำบลหนองขาม อำเภอศรีราชา จังหวัดชลบุรี 20230","province":"ชลบุรี","district":"ศรีราชา","mapX":43.53,"mapY":52.909},{"id":243,"name":"ร้าน สุขเจริญผล","region":"กทม./ปริมณฑล","phone":"","address":"151/5 ถนนนครไชยศรี แขวงถนนนครไชยศรี เขตดุสิต กรุงเทพมหานคร 10300","province":"กรุงเทพมหานคร","district":"ดุสิต กรุงเทพมหานคร","mapX":38.49,"mapY":46.719},{"id":244,"name":"บริษัท สามัคยานุสรณ์ กรุ๊ป จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"18/13-14, 18/88-91 หมู่ที่ 5 ถนนบางกรวย-ไทรน้อย ตำบลโสนลอย อำเภอบางบัวทอง จังหวัดนนทบุรี 11110","province":"นนทบุรี","district":"บางบัวทอง","mapX":36.518,"mapY":43.844},{"id":245,"name":"บริษัท สาธุบิวตี้เซ็นเตอร์ จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"600/44-46 ถนนสาธุประดิษฐ์ แขวงบางโพงพาง เขตยานนาวา กรุงเทพมหานคร 10120","province":"กรุงเทพมหานคร","district":"ยานนาวา กรุงเทพมหานคร","mapX":36.843,"mapY":43.994},{"id":246,"name":"บริษัท สหธนารุ่งเรือง จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"348 ถนนวานิช 1 แขวงจักรวรรดิ เขตสัมพันธวงศ์ กรุงเทพมหานคร 10110","province":"กรุงเทพมหานคร","district":"สัมพันธวงศ์ กรุงเทพมหานคร","mapX":39.936,"mapY":44.902},{"id":247,"name":"ร้าน สหกรณ์ผู้ปฏิบัติงานการไฟฟ้าฝ่ายผลิตแห่งประเทศไทย จํากัด","region":"กทม./ปริมณฑล","phone":"","address":"53 หมู่ 2 ถนนจรัลสนิทวงศ์ ตำบลบางกรวย อำเภอบางกรวย จังหวัดนนทบุรี 11130","province":"นนทบุรี","district":"บางกรวย","mapX":38.066,"mapY":43.516},{"id":248,"name":"ร้าน สวัสดิการทหารอากาศดอนเมือง","region":"กทม./ปริมณฑล","phone":"","address":"171 ร้านสวัสดิการทหารอากาศดอนเมือง แขวงคลองถนน เขตสายไหม กรุงเทพมหานคร 10210","province":"กรุงเทพมหานคร","district":"สายไหม กรุงเทพมหานคร","mapX":37.007,"mapY":46.338},{"id":249,"name":"ร้าน สรรพกิจซุปเปอร์มาร์เก็ต","region":"กทม./ปริมณฑล","phone":"","address":"555 ถนน สรรพาวุธ แขวงบางนาใต้ เขตบางนา กรุงเทพมหานคร 10260","province":"กรุงเทพมหานคร","district":"บางนา กรุงเทพมหานคร","mapX":38.211,"mapY":43.266},{"id":250,"name":"บริษัท สยามรัตนาซุปเปอร์มาร์เก็ต จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"94,96,98,100,102,104,106,108 ถนนลาดหญ้า แขวงคลองสาน เขตคลองสาน กรุงเทพมหานคร 10600","province":"กรุงเทพมหานคร","district":"คลองสาน กรุงเทพมหานคร","mapX":39.412,"mapY":46.379},{"id":251,"name":"ร้าน หกรณ์มหาวิทยาลัยเกษตรศาสตร์ จํากัด","region":"กทม./ปริมณฑล","phone":"","address":"50 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900","province":"กรุงเทพมหานคร","district":"จตุจักร กรุงเทพมหานคร","mapX":36.391,"mapY":44.878},{"id":252,"name":"บริษัท อัน อัน มินิมาร์ท จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"2/3-5 ซอยลาดพร้าว 47(สะพาน 2) ถนนลาดพร้าว แขวงสะพานสอง เขตวังทองหลาง กรุงเทพมหานคร 10310","province":"กรุงเทพมหานคร","district":"วังทองหลาง กรุงเทพมหานคร","mapX":39.667,"mapY":43.934},{"id":253,"name":"บริษัท ไอ ไลฟ์ 2020 จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"55/13 ซอย พุทธบูชา32 แขวงบางมด เขตทุ่งครุ กรุงเทพมหานคร 10140","province":"กรุงเทพมหานคร","district":"ทุ่งครุ กรุงเทพมหานคร","mapX":37.87,"mapY":46.874},{"id":254,"name":"บริษัท อันอัน ดรักส์ แอนด์ มาร์ท จำกัด","region":"กทม./ปริมณฑล","phone":"","address":"320 ถนนรัตนราช ตำบลบางบ่อ อำเภอบางบ่อ จังหวัดสมุทรปราการ 10560","province":"สมุทรปราการ","district":"บางบ่อ","mapX":39.53,"mapY":46.034},{"id":255,"name":"หสม. ฮะเซ่งเชียง","region":"กทม./ปริมณฑล","phone":"","address":"500 ถนนทรงวาด แขวงจักรวรรดิ์ เขตสัมพันธวงศ์ กรุงเทพมหานคร 10100","province":"กรุงเทพมหานคร","district":"สัมพันธวงศ์ กรุงเทพมหานคร","mapX":37.203,"mapY":43.458}]);
  const search=document.getElementById('store67Search');
  const province=document.getElementById('store67Province');
  const regions=document.getElementById('store67Regions');
  const list=document.getElementById('store67List');
  const markers=document.getElementById('store67Markers');
  const detail=document.getElementById('store67Detail');
  const count=document.getElementById('store67Count');
  if(!search||!province||!regions||!list||!markers||!detail||!count) return;

  let activeRegion='',activeProvince='',activeId=null;

  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const nav=s=>'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent((s.name||'')+' '+(s.address||''));

  const provinces=[...new Set(STORES.map(s=>s.province).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
  province.insertAdjacentHTML('beforeend',provinces.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join(''));

  function filtered(){
    const q=(search.value||'').trim().toLowerCase();
    return STORES.filter(s=>{
      if(activeRegion && s.region!==activeRegion) return false;
      if(activeProvince && s.province!==activeProvince) return false;
      if(!q) return true;
      return [s.name,s.address,s.province,s.district,s.phone].join(' ').toLowerCase().includes(q);
    });
  }

  function detailHtml(s){
    const query=[s.name,s.address].filter(Boolean).join(' ');
    const q=encodeURIComponent(query);
    const embedUrl='https://maps.google.com/maps?q='+q+'&z=17&output=embed';
    const mapsUrl='https://www.google.com/maps/search/?api=1&query='+q;
    return `
      <div class="store70-embed">
        <div class="store70-badge">GOOGLE MAPS</div>
        <iframe
          src="${embedUrl}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
          title="Google Maps - ${esc(s.name)}"></iframe>
      </div>
      <div class="store68-detail-body">
        <div class="store67-detail-kicker">${esc(s.region)} • ${esc(s.province)}</div>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.address)}</p>
        ${s.phone?`<p class="phone">โทร. ${esc(s.phone)}</p>`:''}
        <a class="store67-route" href="${nav(s)}" target="_blank" rel="noopener">เปิด Google Maps เพื่อนำทาง ↗</a>
        <div class="store70-actions">
          <a class="store70-mini-btn" href="${mapsUrl}" target="_blank" rel="noopener">ดูร้านบน Google Maps</a>
          <a class="store70-mini-btn" href="${mapsUrl}" target="_blank" rel="noopener">ดูภาพ/Street View ↗</a>
        </div>
        <div class="store70-note"></div>
      </div>
    `;
  }

  function selectStore(id,scrollList=true){
    const s=STORES.find(x=>x.id===Number(id));
    if(!s) return;
    activeId=s.id;
    detail.classList.remove('empty');
    detail.innerHTML=detailHtml(s);
    document.querySelectorAll('.store67-marker').forEach(el=>el.classList.toggle('active',Number(el.dataset.id)===s.id));
    document.querySelectorAll('.store67-item').forEach(el=>el.classList.toggle('active',Number(el.dataset.id)===s.id));
    if(scrollList){
      const row=document.querySelector(`.store67-item[data-id="${s.id}"]`);
      if(row) row.scrollIntoView({block:'nearest',behavior:'smooth'});
    }
  }

  function render(){
    const data=filtered();
    count.textContent=`แสดง ${data.length} จาก ${STORES.length} ร้าน`;
    list.innerHTML=data.length?data.map((s,i)=>`
      <button class="store67-item ${activeId===s.id?'active':''}" data-id="${s.id}">
        <span class="store67-num">${String(i+1).padStart(2,'0')}</span>
        <span>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.address)}</p>
          <small>${esc(s.province)}${s.phone?' • '+esc(s.phone):''}</small>
        </span>
      </button>`).join(''):'<div class="store67-empty">ไม่พบร้านค้าที่ตรงกับการค้นหา</div>';

    markers.innerHTML=data.map(s=>`
      <button class="store67-marker ${activeId===s.id?'active':''}" data-id="${s.id}" data-name="${esc(s.name)}"
        style="left:${s.mapX}%;top:${s.mapY}%" aria-label="${esc(s.name)}"></button>`).join('');

    if(activeId && !data.some(s=>s.id===activeId)){
      activeId=null;
      detail.classList.add('empty');
      detail.innerHTML='<div class="store70-embed"><div class="store70-loading">เลือกจุดร้านค้าเพื่อเปิด Google Maps</div></div><div class="store68-detail-body"><div class="store67-detail-kicker">STORE DETAIL</div><h3>เลือกจุดร้านค้าบนแผนที่</h3><p>ค้นหาที่อยู่และช่องทางติดต่อของร้านค้าที่จำหน่าย CROSS SUPER</p><p class="store67-detail-tip"></p></div>';
    }
  }

  list.addEventListener('click',e=>{
    const row=e.target.closest('[data-id]');
    if(row) selectStore(row.dataset.id,false);
  });
  markers.addEventListener('click',e=>{
    const pin=e.target.closest('.store67-marker');
    if(pin) selectStore(pin.dataset.id,true);
  });

  let timer;
  search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{activeId=null;render();},100);});
  province.addEventListener('change',()=>{activeProvince=province.value;activeId=null;render();});
  regions.addEventListener('click',e=>{
    const b=e.target.closest('[data-region]');
    if(!b) return;
    activeRegion=b.dataset.region||'';
    activeId=null;
    regions.querySelectorAll('.store67-region').forEach(x=>x.classList.toggle('active',x===b));
    render();
  });


  // Thailand-only pan & zoom (no world map tiles)
  const viewport=document.getElementById('store68Viewport');
  const stage=document.getElementById('store68Stage');
  const zoomLabel=document.getElementById('store68ZoomLabel');
  const zoomIn=document.getElementById('store68ZoomIn');
  const zoomOut=document.getElementById('store68ZoomOut');
  const zoomReset=document.getElementById('store68Reset');
  let mapScale=1,mapX=0,mapY=0,isDragging=false,lastPX=0,lastPY=0;

  function clampPan(){
    if(!viewport) return;
    const r=viewport.getBoundingClientRect();
    const maxX=Math.max(0,(r.width*(mapScale-1))/2);
    const maxY=Math.max(0,(r.height*(mapScale-1))/2);
    mapX=Math.max(-maxX,Math.min(maxX,mapX));
    mapY=Math.max(-maxY,Math.min(maxY,mapY));
  }
  function applyMapTransform(){
    clampPan();
    stage.style.transform=`translate(${mapX}px,${mapY}px) scale(${mapScale})`;
    zoomLabel.textContent=Math.round(mapScale*100)+'%';
    viewport.style.cursor=mapScale>1?'grab':'default';
  }
  function setScale(next){
    mapScale=Math.max(1,Math.min(3.2,next));
    if(mapScale===1){mapX=0;mapY=0;}
    applyMapTransform();
  }
  zoomIn.addEventListener('click',()=>setScale(mapScale+.3));
  zoomOut.addEventListener('click',()=>setScale(mapScale-.3));
  zoomReset.addEventListener('click',()=>{mapScale=1;mapX=0;mapY=0;applyMapTransform();});

  viewport.addEventListener('wheel',e=>{
    e.preventDefault();
    setScale(mapScale+(e.deltaY<0?.18:-.18));
  },{passive:false});

  viewport.addEventListener('pointerdown',e=>{
    if(e.target.closest('.store67-marker')||e.target.closest('.store68-control')) return;
    if(mapScale<=1) return;
    isDragging=true;lastPX=e.clientX;lastPY=e.clientY;
    viewport.setPointerCapture?.(e.pointerId);
    viewport.style.cursor='grabbing';
  });
  viewport.addEventListener('pointermove',e=>{
    if(!isDragging) return;
    mapX+=e.clientX-lastPX;mapY+=e.clientY-lastPY;
    lastPX=e.clientX;lastPY=e.clientY;applyMapTransform();
  });
  function stopDrag(e){
    isDragging=false;applyMapTransform();
    try{viewport.releasePointerCapture?.(e.pointerId)}catch(_){}
  }
  viewport.addEventListener('pointerup',stopDrag);
  viewport.addEventListener('pointercancel',stopDrag);
  applyMapTransform();

  render();
})();

;

(() => {
  'use strict';
  const gallery = document.querySelector('.cs-review-grid');
  const dialog = document.getElementById('cs-review-dialog');
  const image = document.getElementById('cs-review-full');
  const count = document.getElementById('cs-review-count');
  const title = document.getElementById('cs-review-title');
  const stage = dialog.querySelector('.cs-review-stage');
  const items = Array.from(gallery.querySelectorAll('[data-review]'));
  let current = 0;
  let opener;
  let touchStart;
  const render = index => {
    current = (index + items.length) % items.length;
    const thumbnail = items[current].querySelector('img');
    image.src = thumbnail.src;
    image.alt = thumbnail.alt;
    count.textContent = `${current + 1} / ${items.length}`;
    title.textContent = `รีวิว CROSS SUPER · ${String(current + 1).padStart(2, '0')}`;
    stage.scrollTop = 0;
  };
  const close = () => { if(dialog.open) dialog.close(); };
  gallery.addEventListener('click', e => {
    const button = e.target.closest('[data-review]');
    if(!button) return;
    opener = button;
    render(items.indexOf(button));
    document.documentElement.classList.add('cs-review-open');
    dialog.showModal();
  });
  dialog.querySelector('[data-review-close]').addEventListener('click', close);
  dialog.querySelector('[data-review-prev]').addEventListener('click', () => render(current - 1));
  dialog.querySelector('[data-review-next]').addEventListener('click', () => render(current + 1));
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('cs-review-open');
    image.removeAttribute('src');
    opener?.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft'){ e.preventDefault(); render(current - 1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); render(current + 1); }
  });
  stage.addEventListener('click', e => { if(e.target === stage) close(); });
  stage.addEventListener('touchstart', e => {
    touchStart = e.touches.length === 1 ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : null;
  }, {passive:true});
  stage.addEventListener('touchend', e => {
    if(!touchStart || !e.changedTouches[0]) return;
    const dx=e.changedTouches[0].clientX-touchStart.x;
    const dy=e.changedTouches[0].clientY-touchStart.y;
    if(Math.abs(dx)>70 && Math.abs(dx)>Math.abs(dy)*1.5) render(current + (dx<0 ? 1 : -1));
    touchStart=null;
  }, {passive:true});
  window.addEventListener('popstate', close);
})();


;
/* Product-page reveals. The approved product handlers remain separate and unchanged. */
(() => {
  const targets = [...document.querySelectorAll('.pd-page .pd-reveal, .pd-listing .pd-reveal')];
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || preference.matches) return;
  let observer;
  try {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('pd-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    document.documentElement.classList.add('pd-motion-ready');
    // Paint the initial state before enabling transitions and observation.
    targets[0]?.getBoundingClientRect();
    requestAnimationFrame(() => {
      document.documentElement.classList.add('pd-motion-animate');
      targets.forEach(target => observer.observe(target));
    });
    preference.addEventListener?.('change', event => {
      if (!event.matches) return;
      observer.disconnect();
      document.documentElement.classList.remove('pd-motion-ready', 'pd-motion-animate');
    });
  } catch (_) {
    observer?.disconnect();
    document.documentElement.classList.remove('pd-motion-ready', 'pd-motion-animate');
  }
})();

;
(() => {
 const root=document.getElementById('page-home');
 if(!root)return;
 const video=document.getElementById('hp97HeroVideo'),toggle=document.getElementById('hp97VideoToggle');
 let userPaused=false;
 const syncVideo=()=>{if(root.classList.contains('active')&&!document.hidden&&!userPaused)video.play().catch(()=>{});else video.pause()};
 video.muted=true;
 toggle.addEventListener('click',()=>{userPaused=!video.paused;if(userPaused)video.pause();else video.play().catch(()=>{});});
 const updateToggle=()=>{toggle.textContent=video.paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',video.paused?window.CSCMS.value("dynamic_995f8642ed28cc","เล่นวิดีโอ"):window.CSCMS.value("dynamic_063721481e9b04","พักวิดีโอ"))};
 video.addEventListener('play',updateToggle);video.addEventListener('pause',updateToggle);
 new MutationObserver(syncVideo).observe(root,{attributes:true,attributeFilter:['class']});document.addEventListener('visibilitychange',syncVideo);syncVideo();
 const stores=JSON.parse(document.getElementById('hp97-store-data').textContent),select=document.getElementById('hp97Province'),pins=document.getElementById('store67Markers'),card=document.getElementById('hp97StoreCard');
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const provinces=[...new Set(stores.map(s=>s.province).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'th'));
 provinces.forEach(province=>{const option=document.createElement('option');option.value=province;option.textContent=province;select.appendChild(option)});
 document.getElementById('hp97ShopCount').textContent=stores.length;
 let selectedId;
 function renderStoreList(data){
  card.innerHTML=`<button class="hp97-card-close" type="button" aria-label="ปิดรายชื่อร้านค้า">×</button><div class="hp121-list-heading"><span>ร้านค้าที่จำหน่าย · ${esc(select.value||window.CSCMS.value("dynamic_c1cee69a30380e","ทั่วประเทศไทย"))}</span><strong>${data.length} ร้านค้า</strong></div><p class="hp121-list-hint">เลื่อนดูรายชื่อและกดเลือกร้านค้า</p><div class="hp121-store-list" role="group" aria-label="รายชื่อร้านค้า${esc(select.value||window.CSCMS.value("dynamic_c1cee69a30380e","ทั่วประเทศไทย"))}">${data.map((s,i)=>`<button class="hp121-store-row" type="button" data-home-store-select="${s.id}" aria-pressed="false"><span class="hp121-store-number">${i+1}</span><span><strong>${esc(s.name)}</strong><small>${esc(s.address)}</small></span></button>`).join('')}</div><div class="hp121-store-detail" aria-live="polite"></div>`;
  card.querySelector('.hp97-card-close').addEventListener('click',()=>card.hidden=true);
 }
 function showStore(s){
  if(!s)return;
  selectedId=s.id;card.hidden=false;
  const map='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s.name+' '+s.address);
  card.querySelector('.hp121-store-detail').innerHTML=`<span class="hp97-card-tag">รายละเอียดร้านค้า · ${esc(s.province)}</span><h3>${esc(s.name)}</h3><p>${esc(s.address)}</p>${s.phone?`<p>โทร. ${esc(s.phone)}</p>`:''}<div class="hp97-card-actions"><a href="#stores" data-route="stores" data-hp97-store="${s.id}">ดูร้านค้า</a><a href="${map}" target="_blank" rel="noopener">เปิด Google Maps</a></div>`;
  card.querySelectorAll('[data-home-store-select]').forEach(row=>{
   const active=Number(row.dataset.homeStoreSelect)===s.id;
   row.classList.toggle('active',active);row.setAttribute('aria-pressed',String(active));
  });
  pins.querySelectorAll('button').forEach(x=>x.classList.toggle('active',Number(x.dataset.id)===s.id));
 }
 // Reuse the approved Store Locator viewport and its original listeners.
 const viewport=document.getElementById('store68Viewport');
 const mapHost=document.getElementById('hp120MapHost');
 const nativeProvince=document.getElementById('store67Province');
 const nativeSearch=document.getElementById('store67Search');
 const nativeCount=document.getElementById('store67Count');
 const mapAnchor=document.createComment('Shared Store Locator map position');
 viewport.before(mapAnchor);
 function syncMapCount(){
  root.querySelector('.hp97-map-caption').textContent=nativeCount.textContent;
 }
 new MutationObserver(syncMapCount).observe(nativeCount,{childList:true,characterData:true,subtree:true});
 function renderPins(){
  document.querySelector('#store67Regions [data-region=""]')?.click();
  nativeSearch.value='';
  nativeProvince.value=select.value;
  nativeProvince.dispatchEvent(new Event('change',{bubbles:true}));
  const filtered=stores.filter(s=>!select.value||s.province===select.value);
  renderStoreList(filtered);
  const initial=filtered.find(s=>s.id===selectedId)||filtered.find(s=>s.province==='กรุงเทพมหานคร')||filtered[0];
  card.hidden=true;
  if(initial)pins.querySelector(`[data-id="${initial.id}"]`)?.click();
  syncMapCount();
 }
 function syncMapMount(){
  if(root.classList.contains('active')){
   if(viewport.parentNode!==mapHost){
    mapHost.appendChild(viewport);
    select.value=nativeProvince.value;
    renderPins();
   }
  }else if(viewport.parentNode===mapHost){
   mapAnchor.after(viewport);
  }
 }
 viewport.addEventListener('click',event=>{
  if(!root.classList.contains('active'))return;
  const pin=event.target.closest('.store67-marker');
  if(pin)showStore(stores.find(s=>s.id===Number(pin.dataset.id)));
 });
 new MutationObserver(syncMapMount).observe(root,{attributes:true,attributeFilter:['class']});
 function openStoreRoute(province,id){
  showRoute('stores');
  syncMapMount();
  const search=document.getElementById('store67Search'),provinceControl=document.getElementById('store67Province');
  document.querySelector('#store67Regions [data-region=""]')?.click();
  search.value='';
  provinceControl.value=province||'';provinceControl.dispatchEvent(new Event('change',{bubbles:true}));
  if(id)document.querySelector(`.store67-marker[data-id="${Number(id)}"]`)?.click();
 }
 select.addEventListener('change',renderPins);
 document.getElementById('hp97StoreForm').addEventListener('submit',event=>{event.preventDefault();openStoreRoute(select.value)});
 root.addEventListener('click',event=>{
  const row=event.target.closest('[data-home-store-select]');
  if(row){pins.querySelector(`[data-id="${Number(row.dataset.homeStoreSelect)}"]`)?.click();return;}
  const details=event.target.closest('[data-hp97-store]'),all=event.target.closest('[data-hp97-all-stores]');
  if(details){const s=stores.find(s=>s.id===Number(details.dataset.hp97Store));queueMicrotask(()=>openStoreRoute(s?.province,s?.id))}
  if(all)queueMicrotask(()=>openStoreRoute(''));
 });
 card.hidden=true;
 syncMapMount();
})();

;
(() => {
 const page=document.getElementById('page-product-laundry');
 if(!page)return;
 page.addEventListener('click',event=>{
  const scroll=event.target.closest('[data-l100-scroll]');
  if(scroll){const target=page.querySelector('#'+scroll.dataset.l100Scroll);if(target)target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});}
  const product=event.target.closest('[data-l100-size]');
  if(product){const target=page.querySelector('#laundrySizeGallery .v25-size-item[data-size="'+product.dataset.l100Size+'"]');if(target)target.click();}
 });
})();

;
/* Navigation for new Softener visual sections only. Existing interaction JS is unchanged. */
document.addEventListener('click',function(event){const button=event.target.closest('#page-product-softener [data-sf102-scroll]');if(!button)return;const target=document.getElementById(button.dataset.sf102Scroll);if(target)target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});

;
/* Navigation for new Iron visual sections only. Existing interaction JS is unchanged. */
document.addEventListener('click',function(event){const button=event.target.closest('#page-product-iron [data-ir103-scroll]');if(!button)return;const target=document.getElementById(button.dataset.ir103Scroll);if(target)target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});

;
/* Scroll navigation for the new Dish sections only; existing interaction logic is unchanged. */
document.addEventListener('click',function(event){const button=event.target.closest('#page-product-dish [data-di104-scroll]');if(!button)return;const target=document.getElementById(button.dataset.di104Scroll);if(target)target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});

;
/* Navigation for new Refresher sections; original spray logic remains unchanged. */
document.addEventListener('click',function(event){const button=event.target.closest('#page-product-refresher [data-rf107-scroll]');if(!button)return;const target=document.getElementById(button.dataset.rf107Scroll);if(target)target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
;
/* Scroll navigation for the new bathroom sections only; the original range input and comparison logic are unchanged. */
document.addEventListener('click',function(event){const button=event.target.closest('#page-product-toilet [data-bt108-scroll]');if(!button)return;const target=document.getElementById(button.dataset.bt108Scroll);if(target)target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
;
document.addEventListener('click',function(event){const button=event.target.closest('[data-fl110-scroll]');if(!button)return;const target=document.getElementById(button.dataset.fl110Scroll);if(target)target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
;
/* New review page scroll navigation only. The original real-review lightbox script is unchanged. */
document.addEventListener('click',function(event){const button=event.target.closest('[data-rv111-scroll]');if(!button)return;const target=document.getElementById(button.dataset.rv111Scroll);if(target)target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
;
/* New hero scroll only. The approved Store Locator script, data and map logic are unchanged. */document.addEventListener('click',function(event){const button=event.target.closest('[data-sl112-scroll]');if(!button)return;const target=document.getElementById(button.dataset.sl112Scroll);if(target)target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
;
/* News only: initialise the real Page Plugin after its route is visible. */
(function(){
 const page=document.getElementById('page-news'),frame=document.getElementById('news114Facebook');
 if(!page||!frame)return;
 const wrap=frame.closest('.news71-iframe-wrap'),status=document.getElementById('news115Status'),retry=document.getElementById('news115Retry'),local=document.getElementById('news115Local');
 let pending=0,notice=0,lastSize='',requested=false;
 const readyText=window.CSCMS.value("dynamic_5121ae8cf8f968","หากไม่เห็นโพสต์ล่าสุด สามารถลองโหลดอีกครั้ง หรือเปิดเพจ Facebook โดยตรง");
 function say(text){status.textContent=text;}
 function settle(){clearTimeout(notice);if(requested)say(readyText);}
 function fit(force){
  pending=0;if(!page.classList.contains('active'))return;
  const r=wrap.getBoundingClientRect();if(r.width<180||r.height<70)return;
  const width=Math.min(500,Math.floor(r.width)),scale=r.width/width,cssHeight=r.height/scale,height=Math.ceil(cssHeight);
  frame.style.setProperty('--news114-width',width+'px');
  frame.style.setProperty('--news114-height',cssHeight+'px');
  frame.style.setProperty('--news114-scale',String(scale));
  const size=width+'x'+height;if(!force&&size===lastSize)return;
  if(navigator.onLine===false){say(window.CSCMS.value("dynamic_e440a13a0fb9de","ขณะนี้อุปกรณ์ออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง"));return;}
  const url=new URL(frame.dataset.facebookSrc);
  url.searchParams.set('width',String(width));url.searchParams.set('height',String(height));
  requested=true;lastSize=size;say(window.CSCMS.value("dynamic_617d2e259018d4","กำลังเชื่อมต่อกับ Facebook…"));
  clearTimeout(notice);notice=setTimeout(()=>say(readyText),8000);
  frame.src=url.href;
 }
 function schedule(){clearTimeout(pending);pending=setTimeout(()=>fit(false),180);}
 /* iframe load fires even for blocked documents: never report posts as loaded. */
 frame.addEventListener('load',settle);
 retry.addEventListener('click',()=>{clearTimeout(pending);fit(true);});
 if(['file:','content:'].includes(location.protocol))local.hidden=false;
 if('ResizeObserver' in window)new ResizeObserver(schedule).observe(wrap);
 else window.addEventListener('resize',schedule,{passive:true});
 new MutationObserver(schedule).observe(page,{attributes:true,attributeFilter:['class']});
 window.addEventListener('pageshow',schedule,{passive:true});
 window.addEventListener('offline',()=>{if(page.classList.contains('active')){clearTimeout(notice);say(window.CSCMS.value("dynamic_e440a13a0fb9de","ขณะนี้อุปกรณ์ออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง"));}},{passive:true});
 schedule();
})();
