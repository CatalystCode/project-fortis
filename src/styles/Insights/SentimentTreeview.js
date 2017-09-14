export const styles = {
    subHeader: {
        color: '#fff',
        paddingLeft: '11px',
        fontSize: '18px',
        fontWeight: 700
    },
    component: {
        display: 'block',
        verticalAlign: 'top',
        width: '100%'
    },
    activeFiltersView: {
        padding: '0px 20px 10px 20px'
    },
    searchBox: {
        padding: '0px 20px 10px 20px'
    },
    subHeaderDescription: {
        color: '#a3a3b3',
        fontSize: '8px',
        fontWeight: 800,
        paddingLeft: '4px'
    },
    titleSpan: {
        paddingRight: '8px'
    }
};

export const treeDataStyle = {
    tree: {
        base: {
            listStyle: 'none',
            backgroundColor: 'rgb(63, 63, 79)',
            margin: 0,
            padding: 0,
            color: '#9DA5AB',
            fontFamily: 'lucida grande ,tahoma,verdana,arial,sans-serif',
            fontSize: '12px'
        },
        node: {
            base: {
                position: 'relative'
            },
            link: {
                cursor: 'pointer',
                position: 'relative',
                padding: '0px 5px',
                display: 'block'
            },
            activeLink: {
                background: '#31363F'
            },
            toggle: {
                base: {
                    position: 'relative',
                    display: 'inline-flex',
                    verticalAlign: 'top',
                    marginLeft: '-5px',
                    height: '24px',
                    width: '24px'
                },
                wrapper: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    margin: '-7px 0 0 -7px',
                    height: '14px'
                },
                height: 14,
                width: 14,
                arrow: {
                    fill: '#9DA5AB',
                    strokeWidth: 0
                }
            },
            header: {
                base: {
                    display: 'inline-flex',
                    verticalAlign: 'top',
                    width: '100%',
                    color: '#9DA5AB'
                },
                baseHighlight: {
                    background: 'rgb(49, 54, 63)',
                    display: 'inline-flex',
                    verticalAlign: 'top',
                    width: '100%',
                    color: '#9DA5AB'
                },
                only: {
                    fontSize: '14px',
                    textDecoration: 'underline',
                    fontWeight: '500'
                },
                badge: {
                    textAlign: 'right',
                    marginRight: '14px'
                },
                parentBadge: {
                    marginRight: '28px',
                    textAlign: 'right',
                },
                connector: {
                    width: '2px',
                    height: '12px',
                    borderLeft: 'solid 2px black',
                    borderBottom: 'solid 2px black',
                    position: 'absolute',
                    top: '0px',
                    left: '-21px'
                },
                title: {
                    lineHeight: '24px',
                    display: 'inline-table',
                    verticalAlign: 'middle'
                }
            },
            subtree: {
                listStyle: 'none',
                paddingLeft: '19px'
            },
            loading: {
                color: '#E2C089'
            }
        }
    }
};