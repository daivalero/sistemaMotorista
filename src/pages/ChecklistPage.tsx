import type { CheckItem } from '../types'
import { Progress } from '../components/Ui'

type Props = {
  checks: CheckItem[]
  onSet: (id: string, value: boolean) => void
}

export function ChecklistPage({ checks, onSet }: Props) {
  const ok = checks.filter((item) => item.ok === true).length
  const attention = checks.filter((item) => item.ok === false).length
  const groups = checks.reduce<string[]>((list, item) => {
    if (!list.includes(item.grupo)) list.push(item.grupo)
    return list
  }, [])

  return (
    <div className="page">
      <p className="lede tight">Confira o veículo antes de sair. Itens em atenção ficam visíveis na rota de hoje.</p>
      <section className="panel check-summary">
        <div>
          <strong>
            {ok} de {checks.length} ok
          </strong>
          <span className="muted">
            {attention > 0 ? `${attention} em atenção` : 'Nenhum item em atenção'}
          </span>
        </div>
        <Progress value={ok} max={checks.length} />
      </section>

      <div className="check-groups">
        {groups.map((group) => (
          <section key={group} className="panel">
            <h2>{group}</h2>
            <ul className="check-list">
              {checks
                .filter((item) => item.grupo === group)
                .map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.label}</strong>
                      <span>{item.detalhe}</span>
                    </div>
                    <div className="check-actions" role="group" aria-label={item.label}>
                      <button
                        type="button"
                        className={item.ok === true ? 'choice ok active' : 'choice ok'}
                        aria-pressed={item.ok === true}
                        onClick={() => onSet(item.id, true)}
                      >
                        Ok
                      </button>
                      <button
                        type="button"
                        className={item.ok === false ? 'choice bad active' : 'choice bad'}
                        aria-pressed={item.ok === false}
                        onClick={() => onSet(item.id, false)}
                      >
                        Atenção
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
