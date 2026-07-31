(async()=>{
  try{
    const files=['app.part1.txt','app.part2.txt','app.part3.txt','app.part4.txt'];
    const parts=[];
    for(const file of files){
      const response=await fetch(`./${file}`,{cache:'no-store'});
      if(!response.ok)throw new Error(`Falha ao carregar ${file}`);
      parts.push(await response.text());
    }
    (0,eval)(parts.join(''));
  }catch(error){
    console.error(error);
    const app=document.getElementById('app');
    if(app)app.innerHTML='<main class="shell"><header class="brand"><div class="brand-mark">📖⚔️</div><h1>Arena Bíblica</h1></header><section class="card"><div class="notice error">Não foi possível carregar o jogo. Atualize a página e tente novamente.</div></section></main>';
  }
})();
