type PageNavItem = {
  id: string;
  title: string;
  showSectionsSubmenu?: boolean;
  sections?: { id: string; title: string }[];
};

type PropertyPageNavProps = {
  pages: PageNavItem[];
  selectedId?: string | null;
  selectedSectionId?: string | null;
  onSelect?: (id: string) => void;
  onSelectSection?: (pageId: string, sectionId: string) => void;
};

export default function PropertyPageNav({
  pages,
  selectedId,
  selectedSectionId,
  onSelect,
  onSelectSection
}: PropertyPageNavProps) {
  if (pages.length === 0) {
    return null;
  }

  const selectedPage = pages.find((p) => p.id === selectedId);
  const showSubmenu =
    selectedPage?.showSectionsSubmenu && (selectedPage.sections?.length ?? 0) > 0;

  const renderSubmenu = (page: (typeof pages)[0]) => (
    <ul className="nav-sublist nav-sublist-inline" role="list">
      {page.sections?.map((section) => (
        <li key={section.id}>
          <button
            type="button"
            className={`nav-subitem${
              selectedSectionId === section.id ? " nav-subitem-active" : ""
            }`}
            onClick={() => onSelectSection?.(page.id, section.id)}
          >
            {section.title}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <nav className="card sticky-nav">
      <ul className="nav-list">
        {pages.map((page) => {
          const isSelected = selectedId === page.id;
          const showInlineSubmenu =
            isSelected && page.showSectionsSubmenu && (page.sections?.length ?? 0) > 0;
          return (
            <li key={page.id} className="nav-item">
              <button
                type="button"
                className={isSelected ? "nav-active" : undefined}
                onClick={() => onSelect?.(page.id)}
              >
                {page.title}
              </button>
              {showInlineSubmenu ? renderSubmenu(page) : null}
            </li>
          );
        })}
      </ul>
      {showSubmenu ? (
        <div className="nav-submenu-container">
          <hr className="nav-submenu-divider" aria-hidden="true" />
          <ul className="nav-sublist nav-sublist-mobile" role="list">
            {selectedPage?.sections?.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  className={`nav-subitem${
                    selectedSectionId === section.id ? " nav-subitem-active" : ""
                  }`}
                  onClick={() => onSelectSection?.(selectedPage.id, section.id)}
                >
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
