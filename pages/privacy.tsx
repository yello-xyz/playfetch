import { ReactNode } from 'react'

export default function Privacy() {
  return (
    <main className='flex flex-col h-screen gap-2 p-8 overflow-y-auto bg-gray-25'>
      <div className='max-w-prose'>
        <span className='text-2xl font-semibold'>Privacy Policy</span>
        <NumberedList>
          <ListItem title='ABOUT US AND THIS PRIVACY POLICY'>
            <NumberedList>
              <ListItem>
                This privacy policy sets out how Play/Fetch (the trading name of Yello XYZ Limited) (“Play/Fetch”, “we”,
                “our”, or “us”) collects, stores, processes, transfers, shares and uses data that identifies or is
                associated with you (your “personal information”) when you use our website at https://playfetch.ai (our
                “Website”), our SaaS platform (our “Platform” and, together with our Website, our Services), or
                otherwise interact with us by email, phone or social media.
              </ListItem>
              <ListItem>
                Please ensure that you have read and understood our collection, storage, use and disclosure of your
                personal information as described in this privacy policy.
              </ListItem>
              <ListItem>
                If you have any questions about this privacy policy or how we use your personal information, please
                contact us by emailing us at hello@playfetch.ai.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='WHO IS RESPONSIBLE FOR YOUR PERSONAL INFORMATION'>
            <NumberedList>
              <ListItem>
                We are the data controller of the personal information we collect and use as described in this privacy
                policy. This means that we determine and are responsible for how your personal information is used when
                you use our Services or otherwise interact with us by email, phone or social media.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='PERSONAL INFORMATION WE COLLECT AND HOW WE USE IT'>
            <Title>Information you provide to us</Title>
            <NumberedList>
              <ListItem>
                We collect personal information that you submit directly to us when you use the Services, or otherwise
                communicate with us through email, phone or social media. We will collect the following information in
                this way:
                <NumberedList>
                  <ListItem>
                    Contact information, such as your first name, last name, email address. We collect this information
                    directly from you.
                    <Table>
                      <TableCell>How we use this personal information</TableCell>
                      <TableCell>Legal basis we rely on</TableCell>
                      <TableCell>
                        We use this information to communicate with you about our Services and to set up and manage your
                        account with us.
                      </TableCell>
                      <TableCell>
                        The processing is necessary for our legitimate interests, namely providing and administering
                        accounts and communicating with customers, prospective customers, and business contacts.
                      </TableCell>
                    </Table>
                  </ListItem>
                </NumberedList>
              </ListItem>
              <Title>Information we collect automatically</Title>
              <ListItem>
                We also automatically collect certain personal information about you and about how you access the
                Services and your device, including the date and time you access the Services, the actions you take on
                the Services, the operating system and IP address you access the Services from and information about the
                browser you use to access the Services (such as browser version, type and window size).
                <Table>
                  <TableCell>How we use this personal information</TableCell>
                  <TableCell>Legal basis we rely on</TableCell>
                  <TableCell>
                    We use this information so we can present the Services to you in the correct format for your device
                    and browser.
                  </TableCell>
                  <TableCell>
                    The processing is necessary for the performance of a contract, namely the Terms of Service.
                  </TableCell>
                  <TableCell>
                    We use this information to:
                    <BulletList>
                      <Bullet>monitor and maintain the performance and security of our Services;</Bullet>
                      <Bullet>
                        identify errors and ways in which we can improve the Services, including developing and testing
                        new features; and
                      </Bullet>
                      <Bullet>conduct analytics.</Bullet>
                    </BulletList>
                  </TableCell>
                  <TableCell>
                    The processing is necessary for our legitimate interests, namely:
                    <BulletList>
                      <Bullet>ensuring the security and integrity of the Services;</Bullet>
                      <Bullet>to create, provide, support and maintain innovative products and features; and</Bullet>
                      <Bullet>
                        to secure our Services and network, to detect, prevent, and address spam and other bad
                        experiences and to investigate suspicious activity or breaches of our terms or policies.
                      </Bullet>
                    </BulletList>
                  </TableCell>
                </Table>
              </ListItem>
              <ListItem>
                We collect the above information through log files, cookies and similar tracking technologies (see below
                for further information).
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='COOKIES AND SIMILAR TECHNOLOGIES'>
            <NumberedList>
              <ListItem>
                We use cookies and similar tracking technologies. Cookies are pieces of code that we transfer to your
                device for record purposes. This helps us to provide certain functionalities on our Website and our
                Platform as well as to monitor and improve our Services in general.
              </ListItem>
              <ListItem>
                We use the following types of cookies:
                <NumberedList>
                  <ListItem>
                    Strictly necessary cookies. These are cookies that are required for the operation of our Services
                    such as cookies that allow you to log in to your account. Without these cookies, certain elements of
                    our Services would not work.
                  </ListItem>
                  <ListItem>
                    Analytical cookies. These allow us to recognise and count the number of visitors, to see how
                    visitors move around our Services and to monitor performance of certain features on our Services
                    which helps us to improve our Services.
                  </ListItem>
                  <ListItem>
                    Functionality cookies. These are used to recognise you as you move around our Services and to
                    remember information that you enter on the site, such as when you fill out a form.
                  </ListItem>
                </NumberedList>
              </ListItem>
              <ListItem>
                More information about the cookies we use and how long they remain on your device is set out in the
                table below.
                <Table cols='grid-cols-[repeat(4,minmax(0,1fr))]'>
                  <TableCell>Cookie Name</TableCell>
                  <TableCell>Type of cookie</TableCell>
                  <TableCell>When is the cookie set?</TableCell>
                  <TableCell>How long does the cookie stay on my device?</TableCell>
                  <TableCell>Login Session</TableCell>
                  <TableCell>Strictly necessary</TableCell>
                  <TableCell>When you first visit the Website.</TableCell>
                  <TableCell>30 days</TableCell>
                  <TableCell>Google Tag Manager</TableCell>
                  <TableCell>Strictly necessary</TableCell>
                  <TableCell>When you first visit the Website.</TableCell>
                  <TableCell>6 months</TableCell>
                  <TableCell>Google Analytics</TableCell>
                  <TableCell>Analytical</TableCell>
                  <TableCell>When you first visit the Website.</TableCell>
                  <TableCell>6 months</TableCell>
                  <TableCell>Facebook Analytics</TableCell>
                  <TableCell>Analytical</TableCell>
                  <TableCell>When you first visit the Website.</TableCell>
                  <TableCell>90 days</TableCell>
                </Table>
              </ListItem>
              <ListItem>
                Other than cookies that are required to operate our Services, we will only place cookies on your device
                with your consent. If you would like to withdraw your consent to non-essential cookies, you can do this
                by deleting the cookies from your device through your browser settings or mobile device settings and
                rejecting non-essential cookies the next time you access our Website.
              </ListItem>
              <ListItem>
                Most browsers will also allow you to disable all cookies through your browser or mobile settings. These
                settings will typically be found in the “options” or “preferences” menu of your browser. Please note
                that if you choose to refuse cookies you may not be able to use the full functionality of our Services.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='HOW LONG WE KEEP YOUR PERSONAL INFORMATION'>
            <NumberedList>
              <ListItem>
                Unless a longer retention period is required or permitted by law, we will only hold your personal
                information on our systems for the period necessary to fulfil the purposes outlined in this Privacy
                Policy or until you request it be deleted.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='RECIPIENTS'>
            <NumberedList>
              <ListItem>
                As required in accordance with how we use your personal information, we may share your personal
                information with third parties that perform services for us or on our behalf, such as providing hosting
                or other technical services such as analytics and AI services, payment services or email services.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='STORING AND TRANSFERRING YOUR PERSONAL INFORMATION'>
            <NumberedList>
              <ListItem>
                Security. We implement appropriate technical and organisational measures to protect your personal
                information against accidental or unlawful destruction, loss, change or damage. All personal information
                we collect will be stored on our secure servers.
              </ListItem>
              <ListItem>
                International Transfers of your personal information. Your personal information is primarily processed
                in the UK, but we may transfer personal information to other locations outside of the European Economic
                Area (EEA). When we do so, we will ensure that it is protected and transferred in a manner consistent
                with legal requirements.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='YOUR RIGHTS IN RESPECT OF YOUR PERSONAL INFORMATION'>
            <NumberedList>
              <ListItem>
                As required in accordance with how we use your personal information, we may share your personal
                information with third parties that perform services for us or on our behalf, such as providing hosting
                or other technical services such as analytics and AI services, payment services or email services.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='LINKS TO THIRD PARTY SITES'>
            <NumberedList>
              <ListItem>
                The Website may, from time to time, contain links to and from third party websites. If you follow a link
                to any of these websites, please note that these websites have their own privacy policies and that we do
                not accept any responsibility or liability for their policies.
              </ListItem>
            </NumberedList>
          </ListItem>
          <ListItem title='CHANGES TO THIS POLICY'>
            <NumberedList>
              <ListItem>
                Any updates we may make to our Privacy Policy will be posted on this page. Please check back frequently
                to see any updates or changes to our Privacy Policy.
              </ListItem>
            </NumberedList>
          </ListItem>
        </NumberedList>
        <Title>Last updated September 2023</Title>
      </div>
    </main>
  )
}

const BulletList = ({ children }: { children: ReactNode }) => <ul className='list-disc list-inside'>{children}</ul>

const Bullet = ({ children }: { children: ReactNode }) => <li>{children}</li>

const NumberedList = ({ children }: { children: ReactNode }) => (
  <ol className='list-outside [counter-reset:section]'>{children}</ol>
)

const ListItem = ({ title, children }: { title?: string; children: ReactNode }) => (
  <li className='px-2 pt-4 before:[counter-increment:section] before:content-[counters(section,".")"._"]'>
    {title && <span className='font-semibold'>{title}</span>}
    {children}
  </li>
)

const Title = ({ children }: { children: ReactNode }) => <div className='px-2 pt-4 font-semibold'>{children}</div>

const Table = ({ children, cols = 'grid-cols-[repeat(2,minmax(0,1fr))]' }: { children: ReactNode; cols?: string }) => (
  <div className={`mt-4 grid ${cols} border`}>{children}</div>
)

const TableCell = ({ children }: { children: ReactNode }) => <div className='p-2 border'>{children}</div>
